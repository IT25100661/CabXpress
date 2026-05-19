package com.cabxpress.repository;

import com.cabxpress.entity.Notification;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface NotificationRepository extends JpaRepository<Notification, Long> {
    List<Notification> findByRecipientIdOrderByCreatedAtDesc(Long recipientId);
    List<Notification> findTop10ByRecipientIdOrderByCreatedAtDesc(Long recipientId);
    long countByRecipientIdAndReadStatusFalse(Long recipientId);
}
