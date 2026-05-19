package com.cabxpress.controller;

import com.cabxpress.dto.ApiDtos.BookingRequest;
import com.cabxpress.dto.ApiDtos.BookingDetailsResponse;
import com.cabxpress.entity.Booking;
import com.cabxpress.exception.ApiException;
import com.cabxpress.repository.BookingRepository;
import com.cabxpress.service.BookingService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/bookings")
public class BookingController {
    private final BookingRepository bookings;
    private final BookingService bookingService;
    public BookingController(BookingRepository bookings, BookingService bookingService) { this.bookings = bookings; this.bookingService = bookingService; }
    @GetMapping public List<BookingDetailsResponse> all() { return bookingService.visibleBookingDetails(); }
    @GetMapping("/my-bookings") public List<BookingDetailsResponse> mine() { return bookingService.myBookingDetails(); }
    @GetMapping("/{id}") public BookingDetailsResponse one(@PathVariable Long id) { return bookingService.details(bookingService.visibleBooking(id)); }
    @PostMapping public BookingDetailsResponse create(@Valid @RequestBody BookingRequest request) { return bookingService.details(bookingService.create(request)); }
    @PutMapping("/{id}") public BookingDetailsResponse update(@PathVariable Long id, @RequestBody Booking input) { return bookingService.details(bookingService.updateAsAdmin(id, input)); }
    @PostMapping("/{id}/cancel") public BookingDetailsResponse cancel(@PathVariable Long id) { return bookingService.details(bookingService.cancel(id)); }
    @DeleteMapping("/{id}") public void delete(@PathVariable Long id) { bookings.delete(find(id)); }
    private Booking find(Long id) { return bookings.findById(id).orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Booking not found")); }
}
