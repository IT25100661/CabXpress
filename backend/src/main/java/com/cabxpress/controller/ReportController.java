package com.cabxpress.controller;

import com.cabxpress.dto.ApiDtos.DashboardReport;
import com.cabxpress.service.ReportService;
import java.util.Map;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/reports")
public class ReportController {
    private final ReportService reportService;
    public ReportController(ReportService reportService) { this.reportService = reportService; }
    @GetMapping("/dashboard") public DashboardReport dashboard() { return reportService.dashboard(); }
    @GetMapping("/revenue") public Map<String, Object> revenue() { return reportService.dashboard().revenueChart(); }
    @GetMapping("/bookings") public Map<String, Object> bookings() { return reportService.dashboard().bookingStatusChart(); }
}
