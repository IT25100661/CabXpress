package com.cabxpress.service;

import com.cabxpress.dto.ApiDtos.PaymentConfirmRequest;
import com.cabxpress.dto.ApiDtos.PaymentIntentRequest;
import com.cabxpress.dto.ApiDtos.PaymentIntentResponse;
import com.cabxpress.dto.ApiDtos.BookingDetailsResponse;
import com.cabxpress.entity.Booking;
import com.cabxpress.entity.Payment;
import com.cabxpress.entity.User;
import com.cabxpress.enums.Role;
import com.cabxpress.enums.BookingStatus;
import com.cabxpress.enums.PaymentStatus;
import com.cabxpress.exception.ApiException;
import com.cabxpress.repository.BookingRepository;
import com.cabxpress.repository.PaymentRepository;
import com.cabxpress.repository.UserRepository;
import com.stripe.Stripe;
import com.stripe.model.PaymentIntent;
import com.stripe.param.PaymentIntentCreateParams;
import java.math.BigDecimal;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

@Service
public class PaymentService {
    private final PaymentRepository payments;
    private final BookingRepository bookings;
    private final BookingService bookingService;
    private final UserRepository users;
    @Value("${app.mock-payment}") private boolean mockPayment;
    @Value("${stripe.secret-key}") private String stripeSecretKey;

    public PaymentService(PaymentRepository payments, BookingRepository bookings, BookingService bookingService, UserRepository users) {
        this.payments = payments;
        this.bookings = bookings;
        this.bookingService = bookingService;
        this.users = users;
    }

    public PaymentIntentResponse createIntent(PaymentIntentRequest request) {
        Booking booking = bookings.findById(request.bookingId()).orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Booking not found"));
        requireBookingOwnerOrAdmin(booking);
        Payment payment = payments.findByBookingId(booking.id).orElseGet(Payment::new);
        payment.booking = booking;
        payment.amount = booking.fareAmount;
        payment.status = PaymentStatus.PENDING;
        boolean canReusePendingIntent = payment.id != null
                && payment.transactionReference != null
                && payment.clientSecret != null
                && payment.status == PaymentStatus.PENDING;
        if (canReusePendingIntent) {
            booking.paymentStatus = PaymentStatus.PENDING;
            booking.bookingStatus = BookingStatus.PENDING_PAYMENT;
            bookings.save(booking);
            return response(payment, booking);
        }
        if (mockPayment || !StringUtils.hasText(stripeSecretKey)) {
            payment.provider = "MOCK";
            payment.transactionReference = "mock_" + UUID.randomUUID();
            payment.clientSecret = "mock_client_secret_" + booking.id;
        } else {
            try {
                Stripe.apiKey = stripeSecretKey;
                PaymentIntentCreateParams params = PaymentIntentCreateParams.builder()
                        .setAmount(booking.fareAmount.multiply(BigDecimal.valueOf(100)).longValue())
                        .setCurrency("lkr")
                        .addPaymentMethodType("card")
                        .putMetadata("bookingReference", booking.bookingReference)
                        .build();
                PaymentIntent intent = PaymentIntent.create(params);
                payment.provider = "STRIPE";
                payment.transactionReference = intent.getId();
                payment.clientSecret = intent.getClientSecret();
            } catch (Exception e) {
                throw new ApiException(HttpStatus.BAD_GATEWAY, "Stripe payment intent failed");
            }
        }
        payments.save(payment);
        booking.paymentStatus = PaymentStatus.PENDING;
        booking.bookingStatus = BookingStatus.PENDING_PAYMENT;
        bookings.save(booking);
        return response(payment, booking);
    }

    public BookingDetailsResponse confirm(PaymentConfirmRequest request) {
        Payment payment = payments.findByTransactionReference(request.transactionReference())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Payment not found"));
        requireBookingOwnerOrAdmin(payment.booking);
        if (payment.status == PaymentStatus.PAID) {
            return bookingService.details(payment.booking);
        }
        boolean paid = "MOCK".equals(payment.provider);
        if ("STRIPE".equals(payment.provider)) {
            if (!StringUtils.hasText(stripeSecretKey)) throw new ApiException(HttpStatus.BAD_GATEWAY, "Stripe is not configured");
            try {
                Stripe.apiKey = stripeSecretKey;
                PaymentIntent intent = PaymentIntent.retrieve(payment.transactionReference);
                paid = "succeeded".equalsIgnoreCase(intent.getStatus());
            } catch (Exception e) {
                throw new ApiException(HttpStatus.BAD_GATEWAY, "Stripe payment verification failed");
            }
        }
        if (paid) {
            payment.status = PaymentStatus.PAID;
            payments.save(payment);
            bookingService.markPaidAndConfirm(payment.booking);
            return bookingService.details(payment.booking);
        }
        payment.status = PaymentStatus.FAILED;
        payments.save(payment);
        bookingService.markPaymentFailed(payment.booking);
        throw new ApiException(HttpStatus.BAD_REQUEST, "Payment could not be confirmed. Please try again.");
    }

    private PaymentIntentResponse response(Payment payment, Booking booking) {
        return new PaymentIntentResponse(
                booking.id,
                payment.id,
                payment.clientSecret,
                payment.transactionReference,
                payment.amount,
                payment.currency == null ? "lkr" : payment.currency.toLowerCase(),
                payment.status,
                "MOCK".equals(payment.provider),
                bookingService.details(booking)
        );
    }

    private void requireBookingOwnerOrAdmin(Booking booking) {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        User user = users.findByEmail(email).orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "Authenticated user not found"));
        if (user.role != Role.ADMIN && !booking.user.id.equals(user.id)) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Payment belongs to another booking");
        }
    }
}
