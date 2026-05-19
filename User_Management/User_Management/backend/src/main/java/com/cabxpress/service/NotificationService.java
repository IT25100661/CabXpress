package com.cabxpress.service;

import com.cabxpress.entity.Booking;
import com.cabxpress.entity.Notification;
import com.cabxpress.entity.User;
import com.cabxpress.enums.NotificationPriority;
import com.cabxpress.enums.NotificationType;
import com.cabxpress.enums.Role;
import com.cabxpress.repository.NotificationRepository;
import com.cabxpress.repository.UserRepository;
import java.time.LocalDateTime;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

@Service
public class NotificationService {
    private final NotificationRepository notifications;
    private final UserRepository users;
    private final EmailService emailService;

    public NotificationService(NotificationRepository notifications, UserRepository users, EmailService emailService) {
        this.notifications = notifications;
        this.users = users;
        this.emailService = emailService;
    }

    public Notification notifyUser(User recipient, Booking booking, String title, String message, NotificationType type, NotificationPriority priority, String actionUrl) {
        return create(recipient, booking, title, message, type, priority, actionUrl, true);
    }

    public void notifyAdmin(Booking booking, String title, String message, NotificationType type, NotificationPriority priority) {
        for (User admin : users.findByRoleAndEnabledTrue(Role.ADMIN)) {
            create(admin, booking, title, message, type, priority, "/admin/bookings", true);
        }
    }

    public Notification notifyDriver(User driver, Booking booking, String title, String message, NotificationType type, NotificationPriority priority) {
        return create(driver, booking, title, message, type, priority, booking == null ? "/driver" : "/driver/trips/" + booking.id, true);
    }

    public void notifyBookingInitialized(Booking booking) {
        notifyUser(booking.user, booking, "Booking initialized", "Your booking has been initialized.", NotificationType.BOOKING_INITIATED, NotificationPriority.NORMAL, "/user/bookings/" + booking.id);
        notifyAdmin(booking, "New booking placed", "New booking placed.", NotificationType.BOOKING_INITIATED, NotificationPriority.HIGH);
    }

    public void notifyBookingConfirmed(Booking booking) {
        notifyUser(booking.user, booking, "Ride confirmed", "Your ride is confirmed.", NotificationType.BOOKING_CONFIRMED, NotificationPriority.HIGH, "/user/bookings/" + booking.id);
        String adminMessage = booking.driver == null
                ? "Booking confirmed but driver assignment is pending. Reference: " + booking.bookingReference
                : "Booking confirmed. Reference: " + booking.bookingReference;
        notifyAdmin(booking, booking.driver == null ? "Driver assignment pending" : "Booking confirmed", adminMessage, NotificationType.BOOKING_CONFIRMED, booking.driver == null ? NotificationPriority.HIGH : NotificationPriority.NORMAL);
        if (booking.driver != null) {
            String message = "New confirmed trip assigned. Reference: %s. Pickup: %s. Destination: %s. Vehicle plate: %s. Customer: %s. Time: %s."
                    .formatted(booking.bookingReference, booking.pickupLocationName, booking.dropLocationName,
                            booking.vehicle == null ? "Not set" : booking.vehicle.numberPlate,
                            booking.user == null ? "Customer" : booking.user.name,
                            booking.scheduledTime == null ? booking.createdAt : booking.scheduledTime);
            notifyDriver(booking.driver, booking, "New confirmed trip assigned", message, NotificationType.DRIVER_ASSIGNED, NotificationPriority.URGENT);
        }
    }

    public void notifyBookingCancelled(Booking booking) {
        notifyUser(booking.user, booking, "Booking cancelled", "Your booking was cancelled.", NotificationType.BOOKING_CANCELLED, NotificationPriority.HIGH, "/user/bookings/" + booking.id);
        notifyAdmin(booking, "Booking cancelled", "Booking cancelled.", NotificationType.BOOKING_CANCELLED, NotificationPriority.NORMAL);
        if (booking.driver != null) notifyDriver(booking.driver, booking, "Assigned trip cancelled", "Assigned trip cancelled.", NotificationType.BOOKING_CANCELLED, NotificationPriority.HIGH);
    }

    public void notifyTripStarted(Booking booking) {
        notifyUser(booking.user, booking, "Trip started", "Your trip has started.", NotificationType.TRIP_STARTED, NotificationPriority.HIGH, "/user/bookings/" + booking.id);
        notifyAdmin(booking, "Trip started", "Trip started.", NotificationType.TRIP_STARTED, NotificationPriority.NORMAL);
    }

    public void notifyTripCompleted(Booking booking) {
        notifyUser(booking.user, booking, "Trip completed", "Your trip has been completed.", NotificationType.TRIP_COMPLETED, NotificationPriority.NORMAL, "/user/bookings/" + booking.id);
        notifyAdmin(booking, "Trip completed", "Trip completed.", NotificationType.TRIP_COMPLETED, NotificationPriority.NORMAL);
        if (booking.driver != null) notifyDriver(booking.driver, booking, "Trip completed successfully", "Trip completed successfully.", NotificationType.TRIP_COMPLETED, NotificationPriority.NORMAL);
    }

    public void notifyPaymentFailed(Booking booking) {
        notifyUser(booking.user, booking, "Payment failed", "Payment failed. Please try again.", NotificationType.PAYMENT_FAILED, NotificationPriority.HIGH, "/user/bookings/" + booking.id);
        notifyAdmin(booking, "Booking payment failed", "Booking payment failed.", NotificationType.PAYMENT_FAILED, NotificationPriority.HIGH);
    }

    public Notification markRead(Notification notification) {
        notification.readStatus = true;
        notification.readAt = LocalDateTime.now();
        return notifications.save(notification);
    }

    public void markAllRead(User user) {
        List<Notification> mine = notifications.findByRecipientIdOrderByCreatedAtDesc(user.id);
        mine.stream().filter(n -> !n.readStatus).forEach(n -> {
            n.readStatus = true;
            n.readAt = LocalDateTime.now();
        });
        notifications.saveAll(mine);
    }

    private Notification create(User recipient, Booking booking, String title, String message, NotificationType type, NotificationPriority priority, String actionUrl, boolean sendEmail) {
        if (recipient == null || !recipient.enabled) return null;
        Notification notification = new Notification();
        notification.recipient = recipient;
        notification.booking = booking;
        notification.title = title;
        notification.message = message;
        notification.type = type;
        notification.priority = priority == null ? NotificationPriority.NORMAL : priority;
        notification.actionUrl = StringUtils.hasText(actionUrl) ? actionUrl : "/";
        Notification saved = notifications.save(notification);
        if (sendEmail) {
            emailService.sendNotificationEmail(recipient.email, "CabXpress: " + title, message + (booking == null ? "" : "\nReference: " + booking.bookingReference));
        }
        return saved;
    }
}
