package com.cabxpress.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "cms_pages", indexes = @Index(name = "idx_cms_slug", columnList = "slug", unique = true))
public class CmsPage {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Long id;
    @Column(nullable = false, unique = true) public String slug;
    public String title;
    @Column(length = 5000) public String content;
    @Column(length = 2000) public String metadataJson;
    public boolean published = true;
    public LocalDateTime createdAt;
    public LocalDateTime updatedAt;
    @PrePersist void onCreate() { createdAt = LocalDateTime.now(); updatedAt = createdAt; }
    @PreUpdate void onUpdate() { updatedAt = LocalDateTime.now(); }
}
