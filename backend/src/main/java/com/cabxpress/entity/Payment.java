package com.cabxpress.entity;

import com.cabxpress.enums.PaymentStatus;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "payments")
public class Payment {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Long id;
    @JsonIgnoreProperties("payment")
    @OneToOne(optional = false) public Booking booking;
    public BigDecimal amount = BigDecimal.ZERO;
    public String currency = "LKR";
    @Enumerated(EnumType.STRING) public PaymentStatus status = PaymentStatus.PENDING;
    public String provider = "MOCK";
    public String transactionReference;
    public String clientSecret;
    public LocalDateTime createdAt;
    public LocalDateTime updatedAt;
    @PrePersist void onCreate() { createdAt = LocalDateTime.now(); updatedAt = createdAt; }
    @PreUpdate void onUpdate() { updatedAt = LocalDateTime.now(); }
}
