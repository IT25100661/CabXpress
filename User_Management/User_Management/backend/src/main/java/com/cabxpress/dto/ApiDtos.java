package com.cabxpress.dto;

import com.cabxpress.enums.BookingStatus;
import com.cabxpress.enums.PaymentStatus;
import jakarta.validation.constraints.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

public class ApiDtos {
    public record SignupRequest(@NotBlank String name, @Email String email, @NotBlank String phone, @Size(min = 8) String password) {}
    public record LoginRequest(@Email String email, @NotBlank String password) {}
    public record VerifyOtpRequest(@Email String email, @NotBlank String otp, String purpose) {}
    public record ForgotPasswordRequest(@Email String email) {}
    public record ResetPasswordRequest(@Email String email, @NotBlank String otp, @Size(min = 8) String newPassword) {}
    public record AuthResponse(String token, UserResponse user, String message) {}
    public record MessageResponse(String message) {}
    public record UserResponse(Long id, String name, String email, String phone, String role, boolean verified, boolean enabled) {}

    public record BookingRequest(
            @NotNull Long vehicleId,
            @NotBlank String pickupLocationName,
            double pickupLatitude,
            double pickupLongitude,
            @NotBlank String dropLocationName,
            double dropLatitude,
            double dropLongitude,
            double distanceKm,
            double durationMinutes,
            LocalDateTime scheduledTime
    ) {}

    public record FareRequest(Long vehicleId, Long categoryId, double distanceKm, double durationMinutes) {}
    public record FareResponse(BigDecimal baseFare, BigDecimal distanceCharge, BigDecimal timeCharge, BigDecimal surgeAmount,
                               BigDecimal discountAmount, BigDecimal totalFare, double distanceKm, double durationMinutes) {}

    public record DistanceRequest(double pickupLatitude, double pickupLongitude, double dropLatitude, double dropLongitude) {}
    public record RouteResponse(double distanceKm, double durationMinutes, String geometry,
                                String provider, boolean estimated, String warning) {}

    public record PaymentIntentRequest(@NotNull Long bookingId) {}
    public record PaymentIntentResponse(Long bookingId, Long paymentId, String clientSecret, String transactionReference,
                                        BigDecimal amount, String currency, PaymentStatus status, boolean mockMode,
                                        BookingDetailsResponse booking) {}
    public record PaymentConfirmRequest(@NotBlank String transactionReference, String providerStatus) {}

    public record ReviewRequest(@NotNull Long vehicleId, @Min(1) @Max(5) int rating, @NotBlank String comment) {}
    public record DashboardReport(long totalUsers, long totalVehicles, long totalBookings, BigDecimal totalRevenue,
                                  long pendingBookings, long confirmedBookings, List<?> recentBookings,
                                  Map<String, Object> revenueChart, Map<String, Object> bookingStatusChart,
                                  Map<String, Object> popularVehicleCategories) {}

    public record BookingSummary(Long id, String bookingReference, String pickup, String drop, BigDecimal fare,
                                 BookingStatus bookingStatus, PaymentStatus paymentStatus, String vehicleName,
                                 String numberPlate, String pickupOtp, LocalDateTime scheduledTime) {}

    public record VehicleDetailsResponse(Long id, String name, String categoryName, String color, String numberPlate,
                                         int seats, int luggageCapacity, String fuelType, String mainImageUrl) {}

    public record DriverDetailsResponse(Long id, String name, String email, String phone, String avatarUrl,
                                        Double rating, boolean assigned) {}

    public record BookingDetailsResponse(Long id, String bookingReference, BookingStatus bookingStatus,
                                         PaymentStatus paymentStatus, String pickupOtp, String pickupLocationName,
                                         String dropLocationName, double distanceKm, double durationMinutes,
                                         BigDecimal fareAmount, LocalDateTime createdAt, LocalDateTime scheduledTime,
                                         String customerName, String customerPhone,
                                         VehicleDetailsResponse vehicle, DriverDetailsResponse driver,
                                         String driverAssignmentStatus) {}
}
