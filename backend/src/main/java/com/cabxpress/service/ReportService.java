package com.cabxpress.service;

import com.cabxpress.dto.ApiDtos.DashboardReport;
import com.cabxpress.enums.BookingStatus;
import com.cabxpress.enums.PaymentStatus;
import com.cabxpress.repository.*;
import java.math.BigDecimal;
import java.util.Map;
import org.springframework.stereotype.Service;

@Service
public class ReportService {
    private final UserRepository users;
    private final VehicleRepository vehicles;
    private final BookingRepository bookings;
    private final VehicleCategoryRepository categories;

    public ReportService(UserRepository users, VehicleRepository vehicles, BookingRepository bookings, VehicleCategoryRepository categories) {
        this.users = users;
        this.vehicles = vehicles;
        this.bookings = bookings;
        this.categories = categories;
    }

    public DashboardReport dashboard() {
        BigDecimal revenue = bookings.findAll().stream()
                .filter(b -> b.paymentStatus == PaymentStatus.PAID)
                .map(b -> b.fareAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        long pending = bookings.findAll().stream().filter(b -> b.bookingStatus == BookingStatus.PENDING).count();
        long confirmed = bookings.findAll().stream().filter(b -> b.bookingStatus == BookingStatus.CONFIRMED).count();
        return new DashboardReport(users.count(), vehicles.count(), bookings.count(), revenue, pending, confirmed,
                bookings.findAll().stream().limit(6).toList(),
                Map.of("labels", new String[]{"Mon", "Tue", "Wed", "Thu", "Fri"}, "values", new int[]{18000, 24000, 21000, 28000, 32000}),
                Map.of("PENDING", pending, "CONFIRMED", confirmed, "COMPLETED", bookings.findAll().stream().filter(b -> b.bookingStatus == BookingStatus.COMPLETED).count()),
                Map.of("categories", categories.findAll().stream().map(c -> c.name).toList()));
    }
}
