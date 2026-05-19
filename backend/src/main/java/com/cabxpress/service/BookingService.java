package com.cabxpress.service;

import com.cabxpress.dto.ApiDtos.BookingRequest;
import com.cabxpress.dto.ApiDtos.BookingDetailsResponse;
import com.cabxpress.dto.ApiDtos.BookingSummary;
import com.cabxpress.dto.ApiDtos.DriverDetailsResponse;
import com.cabxpress.dto.ApiDtos.DistanceRequest;
import com.cabxpress.dto.ApiDtos.FareResponse;
import com.cabxpress.dto.ApiDtos.RouteResponse;
import com.cabxpress.dto.ApiDtos.VehicleDetailsResponse;
import com.cabxpress.entity.*;
import com.cabxpress.enums.BookingStatus;
import com.cabxpress.enums.PaymentStatus;
import com.cabxpress.enums.Role;
import com.cabxpress.enums.VehicleAvailabilityStatus;
import com.cabxpress.exception.ApiException;
import com.cabxpress.repository.*;
import com.cabxpress.util.OtpUtil;
import java.time.LocalDateTime;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

@Service
public class BookingService {
    private final BookingRepository bookings;
    private final UserRepository users;
    private final VehicleRepository vehicles;
    private final PricingRuleRepository pricingRules;
    private final PricingService pricingService;
    private final MapsService mapsService;
    private final EmailService emailService;
    private final NotificationService notificationService;

    public BookingService(BookingRepository bookings, UserRepository users, VehicleRepository vehicles,
                          PricingRuleRepository pricingRules, PricingService pricingService, MapsService mapsService,
                          EmailService emailService, NotificationService notificationService) {
        this.bookings = bookings;
        this.users = users;
        this.vehicles = vehicles;
        this.pricingRules = pricingRules;
        this.pricingService = pricingService;
        this.mapsService = mapsService;
        this.emailService = emailService;
        this.notificationService = notificationService;
    }

    public Booking create(BookingRequest request) {
        User user = currentUser();
        Vehicle vehicle = vehicles.findById(request.vehicleId()).orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Vehicle not found"));
        if (vehicle.availabilityStatus != VehicleAvailabilityStatus.AVAILABLE) throw new ApiException(HttpStatus.BAD_REQUEST, "Vehicle is not available");
        PricingRule rule = pricingRules.findFirstByCategoryIdAndActiveTrue(vehicle.category.id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Pricing rule not found"));
        RouteResponse route = mapsService.route(new DistanceRequest(request.pickupLatitude(), request.pickupLongitude(),
                request.dropLatitude(), request.dropLongitude()));
        FareResponse fare = pricingService.calculate(rule, route.distanceKm(), route.durationMinutes());
        Booking booking = new Booking();
        booking.user = user;
        booking.vehicle = vehicle;
        booking.driver = vehicle.assignedDriver;
        booking.pickupLocationName = request.pickupLocationName();
        booking.pickupLatitude = request.pickupLatitude();
        booking.pickupLongitude = request.pickupLongitude();
        booking.dropLocationName = request.dropLocationName();
        booking.dropLatitude = request.dropLatitude();
        booking.dropLongitude = request.dropLongitude();
        booking.distanceKm = fare.distanceKm();
        booking.durationMinutes = fare.durationMinutes();
        booking.fareAmount = fare.totalFare();
        booking.scheduledTime = request.scheduledTime() == null ? LocalDateTime.now().plusMinutes(15) : request.scheduledTime();
        booking.bookingReference = OtpUtil.bookingReference();
        booking.pickupOtp = OtpUtil.generateOtp();
        booking.bookingStatus = BookingStatus.INITIATED;
        booking.paymentStatus = PaymentStatus.UNPAID;
        Booking saved = bookings.save(booking);
        notificationService.notifyBookingInitialized(saved);
        return saved;
    }

    public List<BookingSummary> myBookings() {
        return bookings.findByUserIdOrderByCreatedAtDesc(currentUser().id).stream().map(this::summary).toList();
    }

    public List<BookingDetailsResponse> myBookingDetails() {
        return bookings.findByUserIdOrderByCreatedAtDesc(currentUser().id).stream().map(this::details).toList();
    }

    public List<Booking> visibleBookings() {
        User user = currentUser();
        if (user.role == Role.ADMIN) return bookings.findAll();
        if (user.role == Role.CAB_DRIVER) return bookings.findByDriverIdOrderByScheduledTimeAsc(user.id);
        return bookings.findByUserIdOrderByCreatedAtDesc(user.id);
    }

    public List<BookingDetailsResponse> visibleBookingDetails() {
        return visibleBookings().stream().map(this::details).toList();
    }

    public Booking visibleBooking(Long id) {
        Booking booking = bookings.findById(id).orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Booking not found"));
        requireVisible(booking);
        return booking;
    }

    public Booking updateAsAdmin(Long id, Booking input) {
        Booking booking = bookings.findById(id).orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Booking not found"));
        if (input.bookingStatus != null) applyBookingStatus(booking, input.bookingStatus);
        if (input.paymentStatus != null) applyPaymentStatus(booking, input.paymentStatus);
        if (input.scheduledTime != null) booking.scheduledTime = input.scheduledTime;
        if (input.pickupLocationName != null) booking.pickupLocationName = input.pickupLocationName;
        if (input.dropLocationName != null) booking.dropLocationName = input.dropLocationName;
        if (input.driver != null && input.driver.id != null) booking.driver = driver(input.driver.id);
        return bookings.save(booking);
    }

    public Booking cancel(Long id) {
        Booking booking = bookings.findById(id).orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Booking not found"));
        requireOwnerOrAdmin(booking);
        booking.bookingStatus = BookingStatus.CANCELLED;
        booking.cancelledAt = LocalDateTime.now();
        releaseVehicle(booking);
        Booking saved = bookings.save(booking);
        notificationService.notifyBookingCancelled(saved);
        return saved;
    }

    public void markPaidAndConfirm(Booking booking) {
        booking.paymentStatus = PaymentStatus.PAID;
        booking.bookingStatus = BookingStatus.CONFIRMED;
        if (booking.driver == null && booking.vehicle.assignedDriver != null) booking.driver = booking.vehicle.assignedDriver;
        booking.vehicle.availabilityStatus = VehicleAvailabilityStatus.UNAVAILABLE;
        vehicles.save(booking.vehicle);
        bookings.save(booking);
        emailService.sendBookingConfirmation(booking);
        notificationService.notifyBookingConfirmed(booking);
    }

    public void markPaymentFailed(Booking booking) {
        booking.paymentStatus = PaymentStatus.FAILED;
        booking.bookingStatus = BookingStatus.PAYMENT_FAILED;
        releaseVehicle(booking);
        bookings.save(booking);
        notificationService.notifyPaymentFailed(booking);
    }

    public Booking startTrip(Long id) {
        Booking booking = bookings.findById(id).orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Booking not found"));
        requireAssignedDriver(booking);
        if (booking.bookingStatus != BookingStatus.CONFIRMED) throw new ApiException(HttpStatus.BAD_REQUEST, "Only confirmed trips can be started");
        booking.bookingStatus = BookingStatus.IN_PROGRESS;
        booking.tripStartedAt = LocalDateTime.now();
        booking.vehicle.availabilityStatus = VehicleAvailabilityStatus.IN_TRIP;
        vehicles.save(booking.vehicle);
        Booking saved = bookings.save(booking);
        notificationService.notifyTripStarted(saved);
        return saved;
    }

    public Booking completeTrip(Long id) {
        Booking booking = bookings.findById(id).orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Booking not found"));
        requireAssignedDriver(booking);
        if (booking.bookingStatus != BookingStatus.IN_PROGRESS) throw new ApiException(HttpStatus.BAD_REQUEST, "Only in-progress trips can be completed");
        booking.bookingStatus = BookingStatus.COMPLETED;
        booking.tripCompletedAt = LocalDateTime.now();
        releaseVehicle(booking);
        Booking saved = bookings.save(booking);
        notificationService.notifyTripCompleted(saved);
        return saved;
    }

    public BookingSummary summary(Booking booking) {
        return new BookingSummary(booking.id, booking.bookingReference, booking.pickupLocationName, booking.dropLocationName,
                booking.fareAmount, booking.bookingStatus, booking.paymentStatus, booking.vehicle.name, booking.vehicle.numberPlate,
                booking.pickupOtp, booking.scheduledTime);
    }

    public BookingDetailsResponse details(Booking booking) {
        Vehicle vehicle = booking.vehicle;
        User driver = booking.driver;
        VehicleDetailsResponse vehicleDetails = vehicle == null ? null : new VehicleDetailsResponse(
                vehicle.id,
                vehicle.name,
                vehicle.category == null ? null : vehicle.category.name,
                vehicle.color,
                vehicle.numberPlate,
                vehicle.seats,
                vehicle.luggageCapacity,
                vehicle.fuelType,
                vehicle.mainImageUrl
        );
        DriverDetailsResponse driverDetails = driver == null ? null : new DriverDetailsResponse(
                driver.id,
                driver.name,
                driver.email,
                driver.phone,
                null,
                null,
                true
        );
        return new BookingDetailsResponse(
                booking.id,
                booking.bookingReference,
                booking.bookingStatus,
                booking.paymentStatus,
                booking.pickupOtp,
                booking.pickupLocationName,
                booking.dropLocationName,
                booking.distanceKm,
                booking.durationMinutes,
                booking.fareAmount,
                booking.createdAt,
                booking.scheduledTime,
                booking.user == null ? null : booking.user.name,
                booking.user == null ? null : booking.user.phone,
                vehicleDetails,
                driverDetails,
                driver == null ? "PENDING" : "ASSIGNED"
        );
    }

    private User currentUser() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return users.findByEmail(email).orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "Authenticated user not found"));
    }

    private User driver(Long id) {
        User user = users.findById(id).orElseThrow(() -> new ApiException(HttpStatus.BAD_REQUEST, "Driver not found"));
        if (user.role != Role.CAB_DRIVER) throw new ApiException(HttpStatus.BAD_REQUEST, "Assigned user is not a cab driver");
        return user;
    }

    private void requireOwnerOrAdmin(Booking booking) {
        User user = currentUser();
        if (!booking.user.id.equals(user.id) && user.role != Role.ADMIN) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Booking belongs to another user");
        }
    }

    private void requireVisible(Booking booking) {
        User user = currentUser();
        if (user.role == Role.ADMIN) return;
        if (user.role == Role.CAB_DRIVER && booking.driver != null && booking.driver.id.equals(user.id)) return;
        if (booking.user.id.equals(user.id)) return;
        throw new ApiException(HttpStatus.FORBIDDEN, "Booking belongs to another account");
    }

    private void requireAssignedDriver(Booking booking) {
        User user = currentUser();
        if (user.role != Role.CAB_DRIVER || booking.driver == null || !booking.driver.id.equals(user.id)) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Trip is not assigned to this driver");
        }
    }

    private void releaseVehicle(Booking booking) {
        if (booking.vehicle != null) {
            booking.vehicle.availabilityStatus = VehicleAvailabilityStatus.AVAILABLE;
            vehicles.save(booking.vehicle);
        }
    }

    private void applyBookingStatus(Booking booking, BookingStatus status) {
        booking.bookingStatus = status;
        if (status == BookingStatus.CONFIRMED) {
            if (booking.driver == null && booking.vehicle.assignedDriver != null) booking.driver = booking.vehicle.assignedDriver;
            booking.vehicle.availabilityStatus = VehicleAvailabilityStatus.UNAVAILABLE;
            vehicles.save(booking.vehicle);
            notificationService.notifyBookingConfirmed(booking);
        } else if (status == BookingStatus.CANCELLED) {
            booking.cancelledAt = LocalDateTime.now();
            releaseVehicle(booking);
            notificationService.notifyBookingCancelled(booking);
        } else if (status == BookingStatus.COMPLETED || status == BookingStatus.PAYMENT_FAILED) {
            releaseVehicle(booking);
        } else if (status == BookingStatus.IN_PROGRESS) {
            booking.tripStartedAt = booking.tripStartedAt == null ? LocalDateTime.now() : booking.tripStartedAt;
            booking.vehicle.availabilityStatus = VehicleAvailabilityStatus.IN_TRIP;
            vehicles.save(booking.vehicle);
        }
    }

    private void applyPaymentStatus(Booking booking, PaymentStatus status) {
        booking.paymentStatus = status;
        if (status == PaymentStatus.FAILED) {
            booking.bookingStatus = BookingStatus.PAYMENT_FAILED;
            releaseVehicle(booking);
            notificationService.notifyPaymentFailed(booking);
        } else if (status == PaymentStatus.PAID && booking.bookingStatus != BookingStatus.CONFIRMED) {
            applyBookingStatus(booking, BookingStatus.CONFIRMED);
        }
    }
}
