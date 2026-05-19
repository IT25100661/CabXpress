package com.cabxpress.controller;

import com.cabxpress.entity.User;
import com.cabxpress.entity.Vehicle;
import com.cabxpress.entity.VehicleCategory;
import com.cabxpress.enums.Role;
import com.cabxpress.enums.VehicleAvailabilityStatus;
import com.cabxpress.exception.ApiException;
import com.cabxpress.repository.ReviewRepository;
import com.cabxpress.repository.UserRepository;
import com.cabxpress.repository.VehicleCategoryRepository;
import com.cabxpress.repository.VehicleRepository;
import java.awt.image.BufferedImage;
import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.List;
import java.util.UUID;
import javax.imageio.ImageIO;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/vehicles")
public class VehicleController {
    private final VehicleRepository vehicles;
    private final VehicleCategoryRepository categories;
    private final ReviewRepository reviews;
    private final UserRepository users;
    private final String uploadDir = "uploads/vehicles";

    public VehicleController(VehicleRepository vehicles, VehicleCategoryRepository categories, ReviewRepository reviews, UserRepository users) {
        this.vehicles = vehicles;
        this.categories = categories;
        this.reviews = reviews;
        this.users = users;
        File dir = new File(uploadDir);
        if (!dir.exists()) dir.mkdirs();
    }

    @GetMapping public List<Vehicle> all() {
        if (currentUserRole() == Role.ADMIN) return vehicles.findAll().stream().map(this::withReviews).toList();
        return vehicles.findByAvailabilityStatus(VehicleAvailabilityStatus.AVAILABLE).stream().map(this::withReviews).toList();
    }

    @GetMapping("/public") public List<Vehicle> publicVehicles() {
        return vehicles.findByAvailabilityStatus(VehicleAvailabilityStatus.AVAILABLE).stream().map(this::withReviews).toList();
    }

    @GetMapping("/{id}") public Vehicle one(@PathVariable Long id) { return withReviews(find(id)); }

    @GetMapping("/category/{categoryId}") public List<Vehicle> byCategory(@PathVariable Long categoryId) {
        Role role = currentUserRole();
        return vehicles.findByCategoryId(categoryId).stream()
                .filter(vehicle -> role == Role.ADMIN || vehicle.availabilityStatus == VehicleAvailabilityStatus.AVAILABLE)
                .map(this::withReviews).toList();
    }

    @PostMapping public Vehicle create(@RequestBody Vehicle vehicle) {
        normalize(vehicle);
        return withReviews(vehicles.save(vehicle));
    }

    @PutMapping("/{id}") public Vehicle update(@PathVariable Long id, @RequestBody Vehicle input) {
        Vehicle vehicle = find(id);
        if (input.name != null) vehicle.name = input.name;
        if (input.category != null && input.category.id != null) vehicle.category = category(input.category.id);
        if (input.brand != null) vehicle.brand = input.brand;
        if (input.model != null) vehicle.model = input.model;
        if (input.vehicleType != null) vehicle.vehicleType = input.vehicleType;
        if (input.color != null) vehicle.color = input.color;
        if (input.numberPlate != null) vehicle.numberPlate = input.numberPlate;
        vehicle.seats = input.seats > 0 ? input.seats : vehicle.seats;
        vehicle.luggageCapacity = input.luggageCapacity >= 0 ? input.luggageCapacity : vehicle.luggageCapacity;
        if (input.fuelType != null) vehicle.fuelType = input.fuelType;
        if (input.transmission != null) vehicle.transmission = input.transmission;
        vehicle.airConditioned = input.airConditioned;
        if (input.mainImageUrl != null) vehicle.mainImageUrl = sanitizeImageUrl(input.mainImageUrl);
        if (input.imageUrl != null && !StringUtils.hasText(vehicle.mainImageUrl)) vehicle.mainImageUrl = sanitizeImageUrl(input.imageUrl);
        if (input.galleryImages != null) vehicle.galleryImages = sanitizeGallery(input.galleryImages);
        if (input.baseFare != null) vehicle.baseFare = input.baseFare;
        if (input.pricePerKm != null) vehicle.pricePerKm = input.pricePerKm;
        if (input.pricePerMinute != null) vehicle.pricePerMinute = input.pricePerMinute;
        if (input.availabilityStatus != null) vehicle.availabilityStatus = input.availabilityStatus;
        if (input.assignedDriver != null) vehicle.assignedDriver = input.assignedDriver.id == null ? null : driver(input.assignedDriver.id);
        if (input.description != null) vehicle.description = input.description;
        if (input.specifications != null) vehicle.specifications = input.specifications;
        normalize(vehicle);
        return withReviews(vehicles.save(vehicle));
    }

    @DeleteMapping("/{id}") public void delete(@PathVariable Long id) { vehicles.delete(find(id)); }

    @PutMapping("/{id}/availability")
    public Vehicle updateAvailability(@PathVariable Long id, @RequestBody Vehicle input) {
        Vehicle vehicle = find(id);
        if (input.availabilityStatus == null) throw new ApiException(HttpStatus.BAD_REQUEST, "Availability status is required");
        vehicle.availabilityStatus = input.availabilityStatus;
        return withReviews(vehicles.save(vehicle));
    }

    @PutMapping("/{id}/images")
    public Vehicle updateImages(@PathVariable Long id, @RequestBody Vehicle input) {
        Vehicle vehicle = find(id);
        if (input.mainImageUrl != null) vehicle.mainImageUrl = sanitizeImageUrl(input.mainImageUrl);
        if (input.imageUrl != null && !StringUtils.hasText(vehicle.mainImageUrl)) vehicle.mainImageUrl = sanitizeImageUrl(input.imageUrl);
        if (input.galleryImages != null) vehicle.galleryImages = sanitizeGallery(input.galleryImages);
        normalize(vehicle);
        return withReviews(vehicles.save(vehicle));
    }

    @PostMapping(value = "/{id}/image", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public Vehicle uploadImage(@PathVariable Long id, @RequestParam("file") MultipartFile file) {
        Vehicle vehicle = find(id);
        String uploadedUrl = storeVehicleImage(file);
        vehicle.mainImageUrl = uploadedUrl;
        vehicle.imageUrl = uploadedUrl;
        normalize(vehicle);
        return withReviews(vehicles.save(vehicle));
    }

    String storeVehicleImage(MultipartFile file) {
        if (file.isEmpty()) throw new ApiException(HttpStatus.BAD_REQUEST, "File is empty");
        if (file.getSize() > 3 * 1024 * 1024) throw new ApiException(HttpStatus.BAD_REQUEST, "Image must be 3 MB or smaller");
        String contentType = file.getContentType();
        if (!List.of("image/jpeg", "image/png", "image/webp").contains(contentType)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Only JPG, PNG, and WebP vehicle images are allowed");
        }
        try {
            String originalFilename = file.getOriginalFilename();
            String extension = ".webp";
            if (originalFilename != null && originalFilename.contains(".")) {
                extension = originalFilename.substring(originalFilename.lastIndexOf(".")).toLowerCase();
            }
            if (!List.of(".jpg", ".jpeg", ".png", ".webp").contains(extension)) {
                throw new ApiException(HttpStatus.BAD_REQUEST, "Only JPG, PNG, and WebP vehicle images are allowed");
            }
            BufferedImage decoded = ImageIO.read(file.getInputStream());
            if (decoded == null || decoded.getWidth() < 1 || decoded.getHeight() < 1) {
                throw new ApiException(HttpStatus.BAD_REQUEST, "Uploaded file is not a valid image");
            }
            String newFilename = UUID.randomUUID() + extension;
            Path uploadPath = Paths.get(uploadDir).toAbsolutePath().normalize();
            Files.createDirectories(uploadPath);
            Path filePath = uploadPath.resolve(newFilename);
            if (!filePath.normalize().startsWith(uploadPath)) throw new ApiException(HttpStatus.BAD_REQUEST, "Invalid image path");
            Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);
            return "/uploads/vehicles/" + newFilename;
        } catch (IOException e) {
            throw new ApiException(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to upload image");
        }
    }

    private Vehicle find(Long id) { return vehicles.findById(id).orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Vehicle not found")); }

    private VehicleCategory category(Long id) {
        return categories.findById(id).orElseThrow(() -> new ApiException(HttpStatus.BAD_REQUEST, "Category not found"));
    }

    private void normalize(Vehicle vehicle) {
        if (vehicle.category == null || vehicle.category.id == null) throw new ApiException(HttpStatus.BAD_REQUEST, "Vehicle category is required");
        vehicle.category = category(vehicle.category.id);
        if (!StringUtils.hasText(vehicle.mainImageUrl)) vehicle.mainImageUrl = vehicle.imageUrl;
        if (StringUtils.hasText(vehicle.mainImageUrl)) vehicle.mainImageUrl = sanitizeImageUrl(vehicle.mainImageUrl);
        vehicle.imageUrl = vehicle.mainImageUrl;
        if (!StringUtils.hasText(vehicle.galleryImages)) vehicle.galleryImages = StringUtils.hasText(vehicle.mainImageUrl) ? vehicle.mainImageUrl.trim() : "";
        vehicle.galleryImages = sanitizeGallery(vehicle.galleryImages);
    }

    private Vehicle withReviews(Vehicle vehicle) {
        if (!StringUtils.hasText(vehicle.mainImageUrl)) vehicle.mainImageUrl = vehicle.imageUrl;
        if (!StringUtils.hasText(vehicle.imageUrl)) vehicle.imageUrl = vehicle.mainImageUrl;
        long count = reviews.countByVehicleId(vehicle.id);
        vehicle.reviewCount = count;
        Double average = reviews.averageRatingByVehicleId(vehicle.id);
        vehicle.averageRating = average == null ? null : Math.round(average * 100.0) / 100.0;
        return vehicle;
    }

    private String sanitizeImageUrl(String value) {
        if (value == null) return null;
        String trimmed = value.trim();
        if (trimmed.isBlank()) return "";
        if (trimmed.matches("(?i)^(https?://|/uploads/|/assets/).+")) return trimmed;
        throw new ApiException(HttpStatus.BAD_REQUEST, "Vehicle image URL must be http(s), /uploads, or /assets");
    }

    private String sanitizeGallery(String gallery) {
        if (gallery == null) return null;
        return List.of(gallery.split("\\n|,")).stream()
                .map(String::trim)
                .filter(item -> !item.isBlank())
                .map(this::sanitizeImageUrl)
                .distinct()
                .reduce((left, right) -> left + "," + right)
                .orElse("");
    }

    private User driver(Long id) {
        User user = users.findById(id).orElseThrow(() -> new ApiException(HttpStatus.BAD_REQUEST, "Driver not found"));
        if (user.role != Role.CAB_DRIVER) throw new ApiException(HttpStatus.BAD_REQUEST, "Assigned user is not a cab driver");
        return user;
    }

    private Role currentUserRole() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || auth instanceof AnonymousAuthenticationToken || !auth.isAuthenticated()) return null;
        return users.findByEmail(auth.getName()).map(user -> user.role).orElse(null);
    }
}
