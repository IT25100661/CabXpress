package com.cabxpress.controller;

import com.cabxpress.dto.ApiDtos.*;
import com.cabxpress.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
    private final AuthService authService;
    public AuthController(AuthService authService) { this.authService = authService; }

    @PostMapping("/signup") public MessageResponse signup(@Valid @RequestBody SignupRequest request) { return authService.signup(request); }
    @PostMapping("/login") public AuthResponse login(@Valid @RequestBody LoginRequest request) { return authService.login(request); }
    @PostMapping("/verify-otp") public MessageResponse verifyOtp(@Valid @RequestBody VerifyOtpRequest request) { return authService.verifyOtp(request); }
    @PostMapping("/resend-otp") public MessageResponse resendOtp(@Valid @RequestBody VerifyOtpRequest request) { return authService.resendOtp(request); }
    @PostMapping("/forgot-password") public MessageResponse forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) { return authService.forgotPassword(request); }
    @PostMapping("/reset-password") public MessageResponse resetPassword(@Valid @RequestBody ResetPasswordRequest request) { return authService.resetPassword(request); }
    @GetMapping("/me") public UserResponse me() { return authService.me(); }
}
