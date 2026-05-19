package com.cabxpress.repository;

import com.cabxpress.entity.Payment;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PaymentRepository extends JpaRepository<Payment, Long> {
    Optional<Payment> findByTransactionReference(String transactionReference);
    Optional<Payment> findByBookingId(Long bookingId);
}
