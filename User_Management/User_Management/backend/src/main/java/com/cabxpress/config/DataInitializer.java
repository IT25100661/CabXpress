package com.cabxpress.config;

import com.cabxpress.entity.*;
import com.cabxpress.enums.Role;
import com.cabxpress.enums.VehicleAvailabilityStatus;
import com.cabxpress.repository.*;
import java.math.BigDecimal;
import java.util.List;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;

@Configuration
public class DataInitializer {
    @Bean
    CommandLineRunner seedData(UserRepository users, VehicleCategoryRepository categories, VehicleRepository vehicles,
                               PricingRuleRepository pricingRules, CmsPageRepository pages, ThemeSettingRepository themes,
                               PasswordEncoder encoder, JdbcTemplate jdbcTemplate) {
        return args -> {
            migrateEnumColumns(jdbcTemplate);
            seedUsers(users, encoder);
            seedCategoriesVehiclesAndPricing(categories, vehicles, pricingRules, users);
            seedCms(pages);
            seedTheme(themes);
        };
    }

    private void migrateEnumColumns(JdbcTemplate jdbcTemplate) {
        jdbcTemplate.execute("ALTER TABLE users MODIFY role VARCHAR(32) NOT NULL");
        jdbcTemplate.execute("ALTER TABLE bookings MODIFY booking_status VARCHAR(32)");
        jdbcTemplate.execute("ALTER TABLE bookings MODIFY payment_status VARCHAR(32)");
        jdbcTemplate.execute("ALTER TABLE vehicles MODIFY availability_status VARCHAR(32)");
    }

    private void seedUsers(UserRepository users, PasswordEncoder encoder) {
        User admin = users.findByEmail("admin@cabxpress.test").orElseGet(User::new);
        admin.name = "CabXpress Admin";
        admin.email = "admin@cabxpress.test";
        admin.phone = "+94770000001";
        admin.passwordHash = encoder.encode("Admin@12345");
        admin.role = Role.ADMIN;
        admin.verified = true;
        admin.enabled = true;
        users.save(admin);

        User user = users.findByEmail("user@cabxpress.test").orElseGet(User::new);
        user.name = "Nimal Perera";
        user.email = "user@cabxpress.test";
        user.phone = "+94770000002";
        user.passwordHash = encoder.encode("User@12345");
        user.role = Role.USER;
        user.verified = true;
        user.enabled = true;
        users.save(user);

        User driver = users.findByEmail("driver@cabxpress.test").orElseGet(User::new);
        driver.name = "CabXpress Driver";
        driver.email = "driver@cabxpress.test";
        driver.phone = "+94770000003";
        driver.passwordHash = encoder.encode("Driver@12345");
        driver.role = Role.CAB_DRIVER;
        driver.verified = true;
        driver.enabled = true;
        users.save(driver);
    }

    private void seedCategoriesVehiclesAndPricing(VehicleCategoryRepository categories, VehicleRepository vehicles, PricingRuleRepository pricingRules, UserRepository users) {
        List<String> names = List.of("Economy", "Business", "Family", "Semi-Luxury", "Van", "Luxury", "Premium SUV");
        for (String name : names) {
            VehicleCategory category = categories.findByName(name).orElseGet(() -> {
                VehicleCategory created = new VehicleCategory();
                created.name = name;
                return created;
            });
            category.description = switch (name) {
                case "Economy" -> "Ideal for everyday city rides and solo travel. Compact, fuel-efficient vehicles with the lowest per-kilometre rate.";
                case "Business" -> "Comfortable sedans for airport transfers, meetings, and professional travel with extra space and a smoother ride.";
                case "Family" -> "Spacious vehicles for families, luggage, and weekend trips with added comfort for passengers.";
                case "Semi-Luxury" -> "A balanced choice with premium comfort at a moderate fare, suitable for longer routes and special plans.";
                case "Van" -> "Best for groups, luggage-heavy airport transfers, and family travel with generous seating capacity.";
                case "Luxury" -> "Premium executive vehicles for VIP transfers, events, and high-comfort travel.";
                case "Premium SUV" -> "Powerful, spacious SUVs for business, family, and outstation routes with extra road presence.";
                default -> "Verified CabXpress vehicle category with transparent pricing.";
            };
            category.iconName = "car";
            category.active = true;
            categories.save(category);
        }
        for (VehicleCategory category : categories.findAll()) {
            if (!names.contains(category.name)) {
                category.active = false;
                categories.save(category);
            }
        }

        for (VehicleCategory category : categories.findByActiveTrue()) {
            PricingRule rule = pricingRules.findFirstByCategoryIdAndActiveTrue(category.id).orElseGet(() -> {
                PricingRule created = new PricingRule();
                created.category = category;
                return created;
            });
            rule.baseFare = price(category.name, 350, 1200, 700);
            rule.pricePerKm = price(category.name, 110, 260, 170);
            rule.pricePerMinute = price(category.name, 18, 45, 26);
            rule.surgeMultiplier = new BigDecimal("1.00");
            rule.minimumFare = price(category.name, 650, 2000, 950);
            rule.discountPercentage = BigDecimal.ZERO;
            rule.active = true;
            pricingRules.save(rule);
        }

        User driver = users.findByEmail("driver@cabxpress.test").orElse(null);
        createVehicle(vehicles, categories, "Toyota Prius", "Economy", "Toyota", "Prius", "Hybrid Sedan", "Pearl White", "CBX-1001", 4, 2, "Hybrid", "Automatic", true, 350, 110, 18, null);
        createVehicle(vehicles, categories, "Suzuki WagonR", "Economy", "Suzuki", "WagonR", "Compact", "Silver", "CBX-1002", 4, 2, "Petrol", "Automatic", true, 320, 95, 16, null);
        createVehicle(vehicles, categories, "Toyota Axio", "Business", "Toyota", "Axio", "Sedan", "Black", "CBX-2001", 4, 3, "Hybrid", "Automatic", true, 500, 140, 22, null);
        createVehicle(vehicles, categories, "Mercedes-Benz S-Class", "Luxury", "Mercedes-Benz", "S-Class", "Luxury Sedan", "Obsidian Black", "CBX-9001", 4, 3, "Petrol", "Automatic", true, 1200, 260, 45, driver);
        createVehicle(vehicles, categories, "Toyota HiAce", "Van", "Toyota", "HiAce", "Passenger Van", "White", "CBX-5001", 10, 8, "Diesel", "Manual", true, 850, 210, 34, null);
        createVehicle(vehicles, categories, "Honda Vezel", "Premium SUV", "Honda", "Vezel", "SUV", "Graphite", "CBX-7001", 4, 4, "Hybrid", "Automatic", true, 700, 180, 30, null);
        createVehicle(vehicles, categories, "Toyota Vellfire", "Family", "Toyota", "Vellfire", "Luxury MPV", "Pearl White", "CBX-6001", 6, 5, "Hybrid", "Automatic", true, 950, 230, 38, null);
        createVehicle(vehicles, categories, "BMW 5 Series", "Luxury", "BMW", "5 Series", "Executive Sedan", "Carbon Black", "CBX-9501", 4, 3, "Petrol", "Automatic", true, 1100, 245, 42, null);
    }

    private BigDecimal price(String category, int normal, int luxury, int fallback) {
        if ("Luxury".equals(category)) return BigDecimal.valueOf(luxury);
        if ("Business".equals(category) || "Family".equals(category)) return BigDecimal.valueOf(fallback);
        if ("Premium SUV".equals(category) || "Van".equals(category)) return BigDecimal.valueOf(fallback);
        return BigDecimal.valueOf(normal);
    }

    private void createVehicle(VehicleRepository vehicles, VehicleCategoryRepository categories, String name, String categoryName,
                               String brand, String model, String type, String color, String plate, int seats, int luggage,
                               String fuel, String transmission, boolean ac, int base, int km, int minute, User assignedDriver) {
        Vehicle vehicle = vehicles.findByNumberPlate(plate).orElseGet(Vehicle::new);
        boolean created = vehicle.id == null;
        vehicle.name = name;
        vehicle.category = categories.findByName(categoryName).orElseThrow();
        vehicle.brand = brand;
        vehicle.model = model;
        vehicle.vehicleType = type;
        vehicle.color = color;
        vehicle.numberPlate = plate;
        vehicle.seats = seats;
        vehicle.luggageCapacity = luggage;
        vehicle.fuelType = fuel;
        vehicle.transmission = transmission;
        vehicle.airConditioned = ac;
        vehicle.baseFare = BigDecimal.valueOf(base);
        vehicle.pricePerKm = BigDecimal.valueOf(km);
        vehicle.pricePerMinute = BigDecimal.valueOf(minute);
        if (vehicle.availabilityStatus == null || vehicle.availabilityStatus == VehicleAvailabilityStatus.BOOKED) vehicle.availabilityStatus = VehicleAvailabilityStatus.AVAILABLE;
        if (assignedDriver != null && vehicle.assignedDriver == null) vehicle.assignedDriver = assignedDriver;
        vehicle.rating = 0.0;
        if (created || vehicle.mainImageUrl == null || vehicle.mainImageUrl.isBlank()) vehicle.mainImageUrl = fallbackImage(categoryName);
        if (created || vehicle.imageUrl == null || vehicle.imageUrl.isBlank()) vehicle.imageUrl = vehicle.mainImageUrl;
        if (created || vehicle.galleryImages == null || vehicle.galleryImages.isBlank()) vehicle.galleryImages = vehicle.mainImageUrl;
        vehicle.description = name + " is a clean, verified CabXpress vehicle suited for city rides, airport transfers, and scheduled travel.";
        vehicle.specifications = "{\"Seats\":\"" + seats + "\",\"Luggage\":\"" + luggage + "\",\"Fuel\":\"" + fuel + "\",\"Transmission\":\"" + transmission + "\",\"AC\":\"" + ac + "\"}";
        vehicles.save(vehicle);
    }

    private String fallbackImage(String categoryName) {
        return switch (categoryName) {
            case "Business" -> "/assets/vehicle-fallbacks/business-sedan.webp";
            case "Family" -> "/assets/vehicle-fallbacks/family-van.webp";
            case "Luxury" -> "/assets/vehicle-fallbacks/luxury-sedan.webp";
            case "Van" -> "/assets/vehicle-fallbacks/family-van.webp";
            case "Premium SUV" -> "/assets/vehicle-fallbacks/suv.webp";
            default -> "/assets/vehicle-fallbacks/economy-car.webp";
        };
    }

    private void seedCms(CmsPageRepository pages) {
        createPage(pages, "home-hero", "Book reliable rides in minutes", "From daily city trips to airport transfers, CabXpress connects customers with clean vehicles, transparent fares, secure payments, and pickup OTP verification.");
        createPage(pages, "about", "About CabXpress", "CabXpress is a premium local mobility service for airport transfers, city rides, business travel, family trips, luxury chauffeur bookings, and outstation rides.");
        createPage(pages, "contact", "Contact CabXpress", "Speak with the CabXpress team about airport pickups, corporate travel, family bookings, or scheduled rides.");
        createPage(pages, "faq", "Frequently Asked Questions", "Book a ride, select a verified vehicle, confirm your fare, pay securely, and share your pickup OTP with the driver at pickup.");
        createPage(pages, "footer", "CabXpress footer", "Reliable taxi and cab booking for city rides, airport transfers, and premium travel.");
    }

    private void createPage(CmsPageRepository pages, String slug, String title, String content) {
        CmsPage page = pages.findBySlug(slug).orElseGet(() -> {
            CmsPage created = new CmsPage();
            created.slug = slug;
            return created;
        });
        page.title = title;
        page.content = content;
        pages.save(page);
    }

    private void seedTheme(ThemeSettingRepository themes) {
        if (themes.count() == 0) {
            ThemeSetting theme = new ThemeSetting();
            theme.name = "CabXpress Premium";
            theme.primaryColor = "#FDB813";
            theme.secondaryColor = "#1A1A1A";
            theme.accentColor = "#0052CC";
            theme.backgroundColor = "#F9F9F9";
            theme.surfaceColor = "#FFFFFF";
            theme.textColor = "#1A1C1C";
            theme.darkModeValues = "{\"background\":\"#1A1A1A\",\"surface\":\"#2F3131\",\"text\":\"#F0F1F1\"}";
            theme.activeTheme = true;
            themes.save(theme);
        }
    }
}
