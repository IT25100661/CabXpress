package com.cabxpress.entity;

import com.cabxpress.enums.Role;
import jakarta.persistence.*;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import java.time.LocalDateTime;

@Entity
@Table(name = "users", indexes = @Index(name = "idx_user_email", columnList = "email", unique = true))
public class User {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Long id;
    @NotBlank public String name;
    @Email @Column(nullable = false, unique = true)
    public String email;
    @Column(nullable = false)
    public String passwordHash;
    @NotBlank public String phone;
    @Enumerated(EnumType.STRING) @Column(nullable = false)
    public Role role = Role.USER;
    public boolean verified = false;
    public boolean enabled = true;
    public LocalDateTime createdAt;
    public LocalDateTime updatedAt;

    @PrePersist
    void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = createdAt;
        email = email == null ? null : email.toLowerCase();
    }

    @PreUpdate
    void onUpdate() {
        updatedAt = LocalDateTime.now();
        email = email == null ? null : email.toLowerCase();
    }
}
