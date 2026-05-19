package com.cabxpress.entity;

import com.cabxpress.enums.NotificationPriority;
import com.cabxpress.enums.NotificationType;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "notifications", indexes = {
        @Index(name = "idx_notification_recipient_created", columnList = "recipient_id,createdAt"),
        @Index(name = "idx_notification_read", columnList = "readStatus")
})
public class Notification {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Long id;

    @JsonIgnoreProperties({"passwordHash", "hibernateLazyInitializer", "handler"})
    @ManyToOne(optional = false) public User recipient;

    @JsonIgnoreProperties({"user", "vehicle", "payment", "hibernateLazyInitializer", "handler"})
    @ManyToOne public Booking booking;

    @Column(nullable = false) public String title;
    @Column(length = 2000, nullable = false) public String message;
    @Enumerated(EnumType.STRING) @Column(nullable = false) public NotificationType type;
    public boolean readStatus = false;
    public LocalDateTime createdAt;
    public LocalDateTime readAt;
    @Enumerated(EnumType.STRING) @Column(nullable = false) public NotificationPriority priority = NotificationPriority.NORMAL;
    public String actionUrl;

    @PrePersist void onCreate() { createdAt = LocalDateTime.now(); }
}
