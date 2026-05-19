package com.cabxpress.controller;

import com.cabxpress.dto.ApiDtos.PaymentConfirmRequest;
import com.cabxpress.dto.ApiDtos.BookingDetailsResponse;
import com.cabxpress.dto.ApiDtos.PaymentIntentRequest;
import com.cabxpress.dto.ApiDtos.PaymentIntentResponse;
import com.cabxpress.service.PaymentService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/payments")
public class PaymentController {
    private final PaymentService paymentService;
    public PaymentController(PaymentService paymentService) { this.paymentService = paymentService; }
    @PostMapping("/create-intent") public PaymentIntentResponse createIntent(@Valid @RequestBody PaymentIntentRequest request) { return paymentService.createIntent(request); }
    @PostMapping("/confirm") public BookingDetailsResponse confirm(@Valid @RequestBody PaymentConfirmRequest request) { return paymentService.confirm(request); }
}
