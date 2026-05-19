package com.cabxpress.controller;

import com.cabxpress.dto.ApiDtos.BookingDetailsResponse;
import com.cabxpress.entity.Booking;
import com.cabxpress.entity.User;
import com.cabxpress.enums.BookingStatus;
import com.cabxpress.exception.ApiException;
import com.cabxpress.repository.BookingRepository;
import com.cabxpress.repository.UserRepository;
import com.cabxpress.repository.VehicleRepository;
import com.cabxpress.service.BookingService;
import java.util.List;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/driver")
public class DriverController {
    private final BookingRepository bookings;
    private final VehicleRepository vehicles;
    private final UserRepository users;
    private final BookingService bookingService;

    public DriverController(BookingRepository bookings, VehicleRepository vehicles, UserRepository users, BookingService bookingService) {
        this.bookings = bookings;
        this.vehicles = vehicles;
        this.users = users;
        this.bookingService = bookingService;
    }

    @GetMapping("/dashboard")
    public Map<String, Object> dashboard() {
        User driver = currentUser();
        List<Booking> active = activeTrips();
        return Map.of(
                "driver", driver,
                "vehicles", vehicles.findByAssignedDriverId(driver.id),
                "activeTrip", active.isEmpty() ? null : bookingService.details(active.get(0)),
                "upcomingTrips", upcomingTrips(),
                "completedTrips", history()
        );
    }

    @GetMapping("/trips/active")
    public List<BookingDetailsResponse> activeTripsResponse() {
        return activeTrips().stream().map(bookingService::details).toList();
    }

    @GetMapping("/trips/upcoming")
    public List<BookingDetailsResponse> upcomingTrips() {
        return bookings.findByDriverIdAndBookingStatusInOrderByScheduledTimeAsc(currentUser().id, List.of(BookingStatus.CONFIRMED))
                .stream().map(bookingService::details).toList();
    }

    @GetMapping("/trips/history")
    public List<BookingDetailsResponse> history() {
        return bookings.findByDriverIdAndBookingStatusOrderByScheduledTimeDesc(currentUser().id, BookingStatus.COMPLETED)
                .stream().map(bookingService::details).toList();
    }

    @GetMapping("/trips/{id}")
    public BookingDetailsResponse trip(@PathVariable Long id) {
        Booking booking = bookings.findById(id).orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Booking not found"));
        if (booking.driver == null || !booking.driver.id.equals(currentUser().id)) throw new ApiException(HttpStatus.FORBIDDEN, "Trip is not assigned to this driver");
        return bookingService.details(booking);
    }

    @PostMapping("/bookings/{id}/start")
    public BookingDetailsResponse start(@PathVariable Long id) { return bookingService.details(bookingService.startTrip(id)); }

    @PostMapping("/bookings/{id}/complete")
    public BookingDetailsResponse complete(@PathVariable Long id) { return bookingService.details(bookingService.completeTrip(id)); }

    private List<Booking> activeTrips() {
        return bookings.findByDriverIdAndBookingStatusInOrderByScheduledTimeAsc(currentUser().id, List.of(BookingStatus.CONFIRMED, BookingStatus.IN_PROGRESS));
    }

    private User currentUser() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return users.findByEmail(email).orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "Authenticated user not found"));
    }
}
