package com.cabxpress.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import java.time.LocalDateTime;

@Entity
@Table(name = "vehicle_categories", indexes = @Index(name = "idx_category_name", columnList = "name", unique = true))
public class VehicleCategory {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Long id;
    @NotBlank @Column(nullable = false, unique = true)
    public String name;
    @Column(length = 1000)
    public String description;
    public String iconName;
    public boolean active = true;
    public LocalDateTime createdAt;
    public LocalDateTime updatedAt;

    @PrePersist void onCreate() { createdAt = LocalDateTime.now(); updatedAt = createdAt; }
    @PreUpdate void onUpdate() { updatedAt = LocalDateTime.now(); }
}
