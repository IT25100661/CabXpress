package com.cabxpress.controller;

import com.cabxpress.entity.VehicleCategory;
import com.cabxpress.exception.ApiException;
import com.cabxpress.repository.VehicleCategoryRepository;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/categories")
public class CategoryController {
    private final VehicleCategoryRepository categories;
    public CategoryController(VehicleCategoryRepository categories) { this.categories = categories; }
    @GetMapping public List<VehicleCategory> all() { return categories.findByActiveTrue(); }
    @GetMapping("/admin") public List<VehicleCategory> adminAll() { return categories.findAll(); }
    @GetMapping("/{id}") public VehicleCategory one(@PathVariable Long id) { return find(id); }
    @PostMapping public VehicleCategory create(@RequestBody VehicleCategory category) { return categories.save(category); }
    @PutMapping("/{id}") public VehicleCategory update(@PathVariable Long id, @RequestBody VehicleCategory input) {
        VehicleCategory category = find(id);
        if (input.name != null) category.name = input.name;
        if (input.description != null) category.description = input.description;
        if (input.iconName != null) category.iconName = input.iconName;
        category.active = input.active;
        return categories.save(category);
    }
    @DeleteMapping("/{id}") public void delete(@PathVariable Long id) {
        VehicleCategory category = find(id);
        category.active = false;
        categories.save(category);
    }
    private VehicleCategory find(Long id) { return categories.findById(id).orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Category not found")); }
}
