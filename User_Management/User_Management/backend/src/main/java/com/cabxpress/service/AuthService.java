package com.cabxpress.service;

import com.cabxpress.dto.ApiDtos.*;
import com.cabxpress.entity.OtpVerification;
import com.cabxpress.entity.User;
import com.cabxpress.enums.Role;
import com.cabxpress.exception.ApiException;
import com.cabxpress.repository.OtpVerificationRepository;
import com.cabxpress.repository.UserRepository;
import com.cabxpress.security.JwtService;
import com.cabxpress.util.OtpUtil;
import java.time.LocalDateTime;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class AuthService {
    private final UserRepository users;
    private final OtpVerificationRepository otps;
    private final PasswordEncoder encoder;
    private final AuthenticationManager authManager;
    private final JwtService jwtService;
    private final EmailService emailService;

    public AuthService(UserRepository users, OtpVerificationRepository otps, PasswordEncoder encoder,
                       AuthenticationManager authManager, JwtService jwtService, EmailService emailService) {
        this.users = users;
        this.otps = otps;
        this.encoder = encoder;
        this.authManager = authManager;
        this.jwtService = jwtService;
        this.emailService = emailService;
    }

    public MessageResponse signup(SignupRequest request) {
        String email = normalize(request.email());
        if (users.existsByEmail(email)) throw new ApiException(HttpStatus.CONFLICT, "Email already registered");
        User user = new User();
        user.name = request.name();
        user.email = email;
        user.phone = request.phone();
        user.passwordHash = encoder.encode(request.password());
        user.role = Role.USER;
        users.save(user);
        issueOtp(email, "SIGNUP");
        return new MessageResponse("Signup successful. Check email/logs for OTP.");
    }

    public AuthResponse login(LoginRequest request) {
        String email = normalize(request.email());
        authManager.authenticate(new UsernamePasswordAuthenticationToken(email, request.password()));
        User user = users.findByEmail(email).orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "Invalid credentials"));
        if (!user.verified) throw new ApiException(HttpStatus.FORBIDDEN, "Email is not verified");
        return new AuthResponse(jwtService.generateToken(user), toResponse(user), "Login successful");
    }

    public MessageResponse verifyOtp(VerifyOtpRequest request) {
        String purpose = request.purpose() == null ? "SIGNUP" : request.purpose();
        OtpVerification otp = activeOtp(normalize(request.email()), purpose);
        if (otp.attempts >= otp.maxAttempts) throw new ApiException(HttpStatus.TOO_MANY_REQUESTS, "OTP attempt limit exceeded");
        otp.attempts++;
        if (otp.expiresAt.isBefore(LocalDateTime.now())) {
            otps.save(otp);
            throw new ApiException(HttpStatus.BAD_REQUEST, "OTP expired");
        }
        if (!encoder.matches(request.otp(), otp.otpHash)) {
            otps.save(otp);
            throw new ApiException(HttpStatus.BAD_REQUEST, "Invalid OTP");
        }
        otp.used = true;
        otps.save(otp);
        if ("SIGNUP".equalsIgnoreCase(purpose)) {
            User user = users.findByEmail(otp.email).orElseThrow();
            user.verified = true;
            users.save(user);
        }
        return new MessageResponse("OTP verified");
    }

    public MessageResponse resendOtp(VerifyOtpRequest request) {
        issueOtp(normalize(request.email()), request.purpose() == null ? "SIGNUP" : request.purpose());
        return new MessageResponse("New OTP sent");
    }

    public MessageResponse forgotPassword(ForgotPasswordRequest request) {
        String email = normalize(request.email());
        if (!users.existsByEmail(email)) throw new ApiException(HttpStatus.NOT_FOUND, "Email not found");
        issueOtp(email, "RESET_PASSWORD");
        return new MessageResponse("Password reset OTP sent");
    }

    public MessageResponse resetPassword(ResetPasswordRequest request) {
        verifyOtp(new VerifyOtpRequest(request.email(), request.otp(), "RESET_PASSWORD"));
        User user = users.findByEmail(normalize(request.email())).orElseThrow();
        user.passwordHash = encoder.encode(request.newPassword());
        users.save(user);
        return new MessageResponse("Password reset successful");
    }

    public UserResponse me() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return users.findByEmail(email).map(this::toResponse).orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "User not found"));
    }

    public UserResponse toResponse(User user) {
        return new UserResponse(user.id, user.name, user.email, user.phone, user.role.name(), user.verified, user.enabled);
    }

    private void issueOtp(String email, String purpose) {
        otps.findTopByEmailAndPurposeAndUsedFalseOrderByCreatedAtDesc(email, purpose).ifPresent(existing -> {
            if (existing.lastSentAt != null && existing.lastSentAt.plusSeconds(45).isAfter(LocalDateTime.now())) {
                throw new ApiException(HttpStatus.TOO_MANY_REQUESTS, "Please wait before requesting another OTP");
            }
            existing.used = true;
            otps.save(existing);
        });
        String rawOtp = OtpUtil.generateOtp();
        OtpVerification otp = new OtpVerification();
        otp.email = email;
        otp.purpose = purpose;
        otp.otpHash = encoder.encode(rawOtp);
        otp.expiresAt = LocalDateTime.now().plusMinutes(5);
        otp.lastSentAt = LocalDateTime.now();
        otps.save(otp);
        emailService.sendOtp(email, rawOtp, purpose);
    }

    private OtpVerification activeOtp(String email, String purpose) {
        return otps.findTopByEmailAndPurposeAndUsedFalseOrderByCreatedAtDesc(email, purpose)
                .orElseThrow(() -> new ApiException(HttpStatus.BAD_REQUEST, "OTP not found"));
    }

    private String normalize(String email) {
        return email == null ? "" : email.trim().toLowerCase();
    }
}
