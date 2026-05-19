package com.cabxpress.repository;

import com.cabxpress.entity.ThemeSetting;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ThemeSettingRepository extends JpaRepository<ThemeSetting, Long> {
    Optional<ThemeSetting> findByActiveThemeTrue();
}
