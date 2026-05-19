package com.cabxpress.repository;

import com.cabxpress.entity.Review;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ReviewRepository extends JpaRepository<Review, Long> {
    List<Review> findByVehicleIdOrderByCreatedAtDesc(Long vehicleId);
    long countByVehicleId(Long vehicleId);
    @Query("select avg(r.rating) from Review r where r.vehicle.id = :vehicleId")
    Double averageRatingByVehicleId(@Param("vehicleId") Long vehicleId);
}
