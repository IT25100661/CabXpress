package com.cabxpress.repository;

import com.cabxpress.entity.PricingRule;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PricingRuleRepository extends JpaRepository<PricingRule, Long> {
    Optional<PricingRule> findFirstByCategoryIdAndActiveTrue(Long categoryId);
}
