package com.cabxpress.controller;

import com.cabxpress.entity.Notification;
import com.cabxpress.entity.User;
import com.cabxpress.exception.ApiException;
import com.cabxpress.repository.NotificationRepository;
import com.cabxpress.repository.UserRepository;
import com.cabxpress.service.NotificationService;
import java.util.List;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

@RestController
public class NotificationController {
    private final NotificationRepository notifications;
    private final UserRepository users;
    private final NotificationService notificationService;

    public NotificationController(NotificationRepository notifications, UserRepository users, NotificationService notificationService) {
        this.notifications = notifications;
        this.users = users;
        this.notificationService = notificationService;
    }

    @GetMapping({"/api/notifications/my", "/api/driver/notifications"})
    public List<Notification> mine() {
        return notifications.findTop10ByRecipientIdOrderByCreatedAtDesc(currentUser().id);
    }

    @GetMapping("/api/notifications/my/unread-count")
    public Map<String, Long> unreadCount() {
        return Map.of("count", notifications.countByRecipientIdAndReadStatusFalse(currentUser().id));
    }

    @PutMapping({"/api/notifications/{id}/read", "/api/driver/notifications/{id}/read"})
    public Notification markRead(@PathVariable Long id) {
        Notification notification = mine(id);
        return notificationService.markRead(notification);
    }

    @PutMapping("/api/notifications/read-all")
    public Map<String, String> markAllRead() {
        notificationService.markAllRead(currentUser());
        return Map.of("message", "Notifications marked read");
    }

    @DeleteMapping("/api/notifications/{id}")
    public void delete(@PathVariable Long id) {
        notifications.delete(mine(id));
    }

    @GetMapping("/api/admin/notifications")
    public List<Notification> adminNotifications() {
        return notifications.findTop10ByRecipientIdOrderByCreatedAtDesc(currentUser().id);
    }

    private Notification mine(Long id) {
        Notification notification = notifications.findById(id).orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Notification not found"));
        if (!notification.recipient.id.equals(currentUser().id)) throw new ApiException(HttpStatus.FORBIDDEN, "Notification belongs to another user");
        return notification;
    }

    private User currentUser() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return users.findByEmail(email).orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "Authenticated user not found"));
    }
}
