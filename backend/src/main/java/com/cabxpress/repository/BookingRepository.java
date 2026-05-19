package com.cabxpress.repository;

import com.cabxpress.entity.Booking;
import com.cabxpress.enums.BookingStatus;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface BookingRepository extends JpaRepository<Booking, Long> {
    List<Booking> findByUserIdOrderByCreatedAtDesc(Long userId);
    List<Booking> findByDriverIdOrderByScheduledTimeAsc(Long driverId);
    List<Booking> findByDriverIdAndBookingStatusInOrderByScheduledTimeAsc(Long driverId, List<BookingStatus> statuses);
    List<Booking> findByDriverIdAndBookingStatusOrderByScheduledTimeDesc(Long driverId, BookingStatus status);
    Optional<Booking> findByBookingReference(String bookingReference);
    long countByBookingStatus(String bookingStatus);
}
