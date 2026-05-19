package com.cabxpress.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "otp_verifications", indexes = @Index(name = "idx_otp_email", columnList = "email"))
public class OtpVerification {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Long id;
    @Column(nullable = false)
    public String email;
    @Column(nullable = false)
    public String otpHash;
    @Column(nullable = false)
    public String purpose;
    public LocalDateTime expiresAt;
    public LocalDateTime lastSentAt;
    public int attempts;
    public int maxAttempts = 5;
    public boolean used;
    public LocalDateTime createdAt;

    @PrePersist
    void onCreate() {
        createdAt = LocalDateTime.now();
        email = email == null ? null : email.toLowerCase();
    }
}
