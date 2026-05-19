package com.cabxpress.entity;

import com.cabxpress.enums.BookingStatus;
import com.cabxpress.enums.PaymentStatus;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "bookings", indexes = @Index(name = "idx_booking_reference", columnList = "bookingReference", unique = true))
public class Booking {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Long id;
    @JsonIgnoreProperties({"passwordHash", "hibernateLazyInitializer", "handler"})
    @ManyToOne(optional = false) public User user;
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    @ManyToOne(optional = false) public Vehicle vehicle;
    @JsonIgnoreProperties({"passwordHash", "hibernateLazyInitializer", "handler"})
    @ManyToOne public User driver;
    public String pickupLocationName;
    public double pickupLatitude;
    public double pickupLongitude;
    public String dropLocationName;
    public double dropLatitude;
    public double dropLongitude;
    public double distanceKm;
    public double durationMinutes;
    public BigDecimal fareAmount = BigDecimal.ZERO;
    @Enumerated(EnumType.STRING) public PaymentStatus paymentStatus = PaymentStatus.UNPAID;
    @Enumerated(EnumType.STRING) public BookingStatus bookingStatus = BookingStatus.INITIATED;
    public String pickupOtp;
    @Column(nullable = false, unique = true) public String bookingReference;
    public LocalDateTime scheduledTime;
    public LocalDateTime tripStartedAt;
    public LocalDateTime tripCompletedAt;
    public LocalDateTime cancelledAt;
    public LocalDateTime createdAt;
    public LocalDateTime updatedAt;

    @JsonIgnoreProperties("booking")
    @OneToOne(mappedBy = "booking", cascade = CascadeType.ALL)
    public Payment payment;

    @PrePersist void onCreate() { createdAt = LocalDateTime.now(); updatedAt = createdAt; }
    @PreUpdate void onUpdate() { updatedAt = LocalDateTime.now(); }
}
