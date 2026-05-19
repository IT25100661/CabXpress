package com.cabxpress.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "reviews")
public class Review {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Long id;
    @JsonIgnoreProperties({"passwordHash", "email", "phone", "verified", "enabled", "hibernateLazyInitializer", "handler"})
    @ManyToOne(optional = false) public User user;
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    @ManyToOne(optional = false) public Vehicle vehicle;
    public int rating;
    @Column(length = 1000) public String comment;
    public LocalDateTime createdAt;
    public LocalDateTime updatedAt;
    @PrePersist void onCreate() { createdAt = LocalDateTime.now(); updatedAt = createdAt; }
    @PreUpdate void onUpdate() { updatedAt = LocalDateTime.now(); }
}
