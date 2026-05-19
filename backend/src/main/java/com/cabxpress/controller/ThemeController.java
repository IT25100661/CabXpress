package com.cabxpress.controller;

import com.cabxpress.entity.ThemeSetting;
import com.cabxpress.exception.ApiException;
import com.cabxpress.repository.ThemeSettingRepository;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/themes")
public class ThemeController {
    private final ThemeSettingRepository themes;
    public ThemeController(ThemeSettingRepository themes) { this.themes = themes; }
    @GetMapping public List<ThemeSetting> all() { return themes.findAll().stream().filter(theme -> theme.activeTheme).toList(); }
    @GetMapping("/admin") public List<ThemeSetting> adminAll() { return themes.findAll(); }
    @PostMapping public ThemeSetting create(@RequestBody ThemeSetting theme) { return themes.save(theme); }
    @PutMapping("/{id}") public ThemeSetting update(@PathVariable Long id, @RequestBody ThemeSetting input) {
        ThemeSetting theme = themes.findById(id).orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Theme not found"));
        if (input.name != null) theme.name = input.name;
        if (input.primaryColor != null) theme.primaryColor = input.primaryColor;
        if (input.secondaryColor != null) theme.secondaryColor = input.secondaryColor;
        if (input.accentColor != null) theme.accentColor = input.accentColor;
        if (input.backgroundColor != null) theme.backgroundColor = input.backgroundColor;
        if (input.surfaceColor != null) theme.surfaceColor = input.surfaceColor;
        if (input.textColor != null) theme.textColor = input.textColor;
        if (input.darkModeValues != null) theme.darkModeValues = input.darkModeValues;
        theme.activeTheme = input.activeTheme;
        return themes.save(theme);
    }
    @DeleteMapping("/{id}") public void delete(@PathVariable Long id) { themes.deleteById(id); }
    @PostMapping("/activate/{id}") public ThemeSetting activate(@PathVariable Long id) {
        themes.findAll().forEach(t -> { t.activeTheme = false; themes.save(t); });
        ThemeSetting theme = themes.findById(id).orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Theme not found"));
        theme.activeTheme = true;
        return themes.save(theme);
    }
}
