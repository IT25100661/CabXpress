package com.cabxpress.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "pricing_rules")
public class PricingRule {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Long id;
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    @ManyToOne(optional = false) public VehicleCategory category;
    public BigDecimal baseFare = BigDecimal.ZERO;
    public BigDecimal pricePerKm = BigDecimal.ZERO;
    public BigDecimal pricePerMinute = BigDecimal.ZERO;
    public BigDecimal surgeMultiplier = BigDecimal.ONE;
    public BigDecimal minimumFare = BigDecimal.ZERO;
    public BigDecimal discountPercentage = BigDecimal.ZERO;
    public boolean active = true;
    public LocalDateTime createdAt;
    public LocalDateTime updatedAt;
    @PrePersist void onCreate() { createdAt = LocalDateTime.now(); updatedAt = createdAt; }
    @PreUpdate void onUpdate() { updatedAt = LocalDateTime.now(); }
}
