package com.cabxpress.entity;

import com.cabxpress.enums.VehicleAvailabilityStatus;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "vehicles", indexes = @Index(name = "idx_vehicle_plate", columnList = "numberPlate", unique = true))
public class Vehicle {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Long id;
    public String name;
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    @ManyToOne(optional = false) public VehicleCategory category;
    public String brand;
    public String model;
    public String vehicleType;
    public String color;
    @Column(nullable = false, unique = true) public String numberPlate;
    public int seats;
    public int luggageCapacity;
    public String fuelType;
    public String transmission;
    public boolean airConditioned;
    @Column(length = 1000) public String mainImageUrl;
    @Column(length = 1000) public String imageUrl;
    @Column(length = 2000) public String galleryImages;
    public BigDecimal baseFare = BigDecimal.ZERO;
    public BigDecimal pricePerKm = BigDecimal.ZERO;
    public BigDecimal pricePerMinute = BigDecimal.ZERO;
    @Enumerated(EnumType.STRING) public VehicleAvailabilityStatus availabilityStatus = VehicleAvailabilityStatus.AVAILABLE;
    @JsonIgnoreProperties({"passwordHash", "hibernateLazyInitializer", "handler"})
    @ManyToOne public User assignedDriver;
    public double rating = 0.0;
    @Transient public Double averageRating;
    @Transient public Long reviewCount;
    @Column(length = 2000) public String description;
    @Column(length = 3000) public String specifications;
    public LocalDateTime createdAt;
    public LocalDateTime updatedAt;

    @PrePersist void onCreate() { syncImageFields(); createdAt = LocalDateTime.now(); updatedAt = createdAt; }
    @PreUpdate void onUpdate() { syncImageFields(); updatedAt = LocalDateTime.now(); }

    private void syncImageFields() {
        if (mainImageUrl == null || mainImageUrl.isBlank()) mainImageUrl = imageUrl;
        if (imageUrl == null || imageUrl.isBlank()) imageUrl = mainImageUrl;
    }
}
