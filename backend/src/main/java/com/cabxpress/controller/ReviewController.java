package com.cabxpress.controller;

import com.cabxpress.dto.ApiDtos.ReviewRequest;
import com.cabxpress.entity.Review;
import com.cabxpress.exception.ApiException;
import com.cabxpress.repository.*;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/reviews")
public class ReviewController {
    private final ReviewRepository reviews;
    private final UserRepository users;
    private final VehicleRepository vehicles;
    public ReviewController(ReviewRepository reviews, UserRepository users, VehicleRepository vehicles) {
        this.reviews = reviews; this.users = users; this.vehicles = vehicles;
    }
    @GetMapping public List<Review> all() { return reviews.findAll(); }
    @GetMapping("/{id}") public Review one(@PathVariable Long id) { return reviews.findById(id).orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Review not found")); }
    @GetMapping("/vehicle/{vehicleId}") public List<Review> byVehicle(@PathVariable Long vehicleId) { return reviews.findByVehicleIdOrderByCreatedAtDesc(vehicleId); }
    @PostMapping public Review create(@Valid @RequestBody ReviewRequest request) {
        Review review = new Review();
        review.user = users.findByEmail(SecurityContextHolder.getContext().getAuthentication().getName()).orElseThrow();
        review.vehicle = vehicles.findById(request.vehicleId()).orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Vehicle not found"));
        review.rating = request.rating();
        review.comment = request.comment();
        return reviews.save(review);
    }
    @PutMapping("/{id}") public Review update(@PathVariable Long id, @RequestBody Review input) {
        Review review = reviews.findById(id).orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Review not found"));
        if (input.rating < 1 || input.rating > 5) throw new ApiException(HttpStatus.BAD_REQUEST, "Rating must be between 1 and 5");
        review.rating = input.rating;
        review.comment = input.comment;
        return reviews.save(review);
    }
    @DeleteMapping("/{id}") public void delete(@PathVariable Long id) { reviews.deleteById(id); }
}
