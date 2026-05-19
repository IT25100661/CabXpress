package com.cabxpress.service;

import com.cabxpress.dto.ApiDtos.FareRequest;
import com.cabxpress.dto.ApiDtos.FareResponse;
import com.cabxpress.entity.PricingRule;
import com.cabxpress.entity.Vehicle;
import com.cabxpress.exception.ApiException;
import com.cabxpress.repository.PricingRuleRepository;
import com.cabxpress.repository.VehicleRepository;
import java.math.BigDecimal;
import java.math.RoundingMode;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

@Service
public class PricingService {
    private final PricingRuleRepository pricingRules;
    private final VehicleRepository vehicles;

    public PricingService(PricingRuleRepository pricingRules, VehicleRepository vehicles) {
        this.pricingRules = pricingRules;
        this.vehicles = vehicles;
    }

    public FareResponse calculate(FareRequest request) {
        if (request.distanceKm() <= 0 || request.durationMinutes() <= 0) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Route distance and duration are required");
        }
        Long categoryId = request.categoryId();
        if (request.vehicleId() != null) {
            Vehicle vehicle = vehicles.findById(request.vehicleId())
                    .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Vehicle not found"));
            categoryId = vehicle.category.id;
        }
        if (categoryId == null) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Vehicle or category is required for fare calculation");
        }
        PricingRule rule = pricingRules.findFirstByCategoryIdAndActiveTrue(categoryId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Active pricing rule not found"));
        return calculate(rule, request.distanceKm(), request.durationMinutes());
    }

    public FareResponse calculate(PricingRule rule, double distanceKm, double durationMinutes) {
        BigDecimal distance = rule.pricePerKm.multiply(BigDecimal.valueOf(distanceKm));
        BigDecimal time = rule.pricePerMinute.multiply(BigDecimal.valueOf(durationMinutes));
        BigDecimal subtotal = rule.baseFare.add(distance).add(time);
        BigDecimal surged = subtotal.multiply(rule.surgeMultiplier);
        BigDecimal surgeAmount = surged.subtract(subtotal);
        BigDecimal discount = surged.multiply(rule.discountPercentage).divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
        BigDecimal total = surged.subtract(discount).max(rule.minimumFare).setScale(2, RoundingMode.HALF_UP);
        return new FareResponse(rule.baseFare, distance.setScale(2, RoundingMode.HALF_UP), time.setScale(2, RoundingMode.HALF_UP),
                surgeAmount.setScale(2, RoundingMode.HALF_UP), discount, total, distanceKm, durationMinutes);
    }
}
