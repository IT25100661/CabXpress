package com.cabxpress.controller;

import com.cabxpress.dto.ApiDtos.FareRequest;
import com.cabxpress.dto.ApiDtos.FareResponse;
import com.cabxpress.entity.PricingRule;
import com.cabxpress.entity.VehicleCategory;
import com.cabxpress.exception.ApiException;
import com.cabxpress.repository.PricingRuleRepository;
import com.cabxpress.repository.VehicleCategoryRepository;
import com.cabxpress.service.PricingService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/pricing")
public class PricingController {
    private final PricingRuleRepository pricing;
    private final VehicleCategoryRepository categories;
    private final PricingService pricingService;
    public PricingController(PricingRuleRepository pricing, VehicleCategoryRepository categories, PricingService pricingService) {
        this.pricing = pricing;
        this.categories = categories;
        this.pricingService = pricingService;
    }
    @GetMapping public List<PricingRule> all() { return pricing.findAll(); }
    @GetMapping("/{id}") public PricingRule one(@PathVariable Long id) { return find(id); }
    @PostMapping public PricingRule create(@RequestBody PricingRule rule) {
        normalize(rule);
        return pricing.save(rule);
    }
    @PutMapping("/{id}") public PricingRule update(@PathVariable Long id, @RequestBody PricingRule input) {
        PricingRule rule = find(id);
        if (input.category != null && input.category.id != null) rule.category = category(input.category.id);
        if (input.baseFare != null) rule.baseFare = input.baseFare;
        if (input.pricePerKm != null) rule.pricePerKm = input.pricePerKm;
        if (input.pricePerMinute != null) rule.pricePerMinute = input.pricePerMinute;
        if (input.minimumFare != null) rule.minimumFare = input.minimumFare;
        if (input.surgeMultiplier != null) rule.surgeMultiplier = input.surgeMultiplier;
        if (input.discountPercentage != null) rule.discountPercentage = input.discountPercentage;
        rule.active = input.active;
        return pricing.save(rule);
    }
    @DeleteMapping("/{id}") public void delete(@PathVariable Long id) {
        PricingRule rule = find(id);
        rule.active = false;
        pricing.save(rule);
    }
    @PostMapping("/calculate") public FareResponse calculate(@Valid @RequestBody FareRequest request) { return pricingService.calculate(request); }
    private PricingRule find(Long id) { return pricing.findById(id).orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Pricing rule not found")); }
    private VehicleCategory category(Long id) { return categories.findById(id).orElseThrow(() -> new ApiException(HttpStatus.BAD_REQUEST, "Category not found")); }
    private void normalize(PricingRule rule) {
        if (rule.category == null || rule.category.id == null) throw new ApiException(HttpStatus.BAD_REQUEST, "Pricing category is required");
        rule.category = category(rule.category.id);
    }
}
