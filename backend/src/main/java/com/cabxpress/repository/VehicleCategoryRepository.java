package com.cabxpress.repository;

import com.cabxpress.entity.VehicleCategory;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface VehicleCategoryRepository extends JpaRepository<VehicleCategory, Long> {
    Optional<VehicleCategory> findByName(String name);
    List<VehicleCategory> findByActiveTrue();
}
