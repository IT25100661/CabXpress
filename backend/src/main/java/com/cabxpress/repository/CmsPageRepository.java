package com.cabxpress.repository;

import com.cabxpress.entity.CmsPage;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CmsPageRepository extends JpaRepository<CmsPage, Long> {
    Optional<CmsPage> findBySlug(String slug);
}
