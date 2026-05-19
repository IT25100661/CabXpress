package com.cabxpress.service;

import com.cabxpress.entity.Booking;
import java.util.concurrent.CompletableFuture;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

@Service
public class EmailService {
    private static final Logger log = LoggerFactory.getLogger(EmailService.class);
    private final JavaMailSender mailSender;
    @Value("${app.mock-email}") private boolean mockEmail;
    @Value("${app.mail-from}") private String from;

    public EmailService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    public void sendOtp(String email, String otp, String purpose) {
        String subject = "CabXpress " + purpose + " OTP";
        String body = "Your CabXpress OTP is " + otp + ". It expires in 5 minutes.";
        send(email, subject, body);
    }

    public void sendBookingConfirmation(Booking booking) {
        String body = """
                Your CabXpress booking is confirmed.
                Reference: %s
                Pickup OTP: %s
                Pickup: %s
                Destination: %s
                Vehicle: %s
                Number plate: %s
                Fare: %s
                Scheduled: %s
                """.formatted(booking.bookingReference, booking.pickupOtp, booking.pickupLocationName,
                booking.dropLocationName, booking.vehicle.name, booking.vehicle.numberPlate,
                booking.fareAmount, booking.scheduledTime);
        send(booking.user.email, "CabXpress booking confirmation " + booking.bookingReference, body);
    }

    public void sendNotificationEmail(String to, String subject, String body) {
        send(to, subject, body);
    }

    private void send(String to, String subject, String body) {
        if (mockEmail || !StringUtils.hasText(to)) {
            log.info("MOCK EMAIL to={} subject={} body={}", to, subject, body);
            return;
        }
        CompletableFuture.runAsync(() -> {
            try {
                SimpleMailMessage message = new SimpleMailMessage();
                message.setFrom(from);
                message.setTo(to);
                message.setSubject(subject);
                message.setText(body);
                mailSender.send(message);
            } catch (Exception ex) {
                log.warn("Email delivery failed for {} subject={}: {}", to, subject, ex.getMessage());
            }
        });
    }
}
