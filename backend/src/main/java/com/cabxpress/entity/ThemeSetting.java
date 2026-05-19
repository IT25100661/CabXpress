package com.cabxpress.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "theme_settings")
public class ThemeSetting {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Long id;
    public String name;
    public String primaryColor;
    public String secondaryColor;
    public String accentColor;
    public String backgroundColor;
    public String surfaceColor;
    public String textColor;
    @Column(length = 2000) public String darkModeValues;
    public boolean activeTheme;
    public LocalDateTime createdAt;
    public LocalDateTime updatedAt;
    @PrePersist void onCreate() { createdAt = LocalDateTime.now(); updatedAt = createdAt; }
    @PreUpdate void onUpdate() { updatedAt = LocalDateTime.now(); }
}
