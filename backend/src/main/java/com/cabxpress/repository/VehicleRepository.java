package com.cabxpress.repository;

import com.cabxpress.entity.Vehicle;
import com.cabxpress.enums.VehicleAvailabilityStatus;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface VehicleRepository extends JpaRepository<Vehicle, Long> {
    List<Vehicle> findByCategoryId(Long categoryId);
    List<Vehicle> findByAvailabilityStatus(VehicleAvailabilityStatus availabilityStatus);
    List<Vehicle> findByAssignedDriverId(Long driverId);
    boolean existsByNumberPlate(String numberPlate);
    Optional<Vehicle> findByNumberPlate(String numberPlate);
}
