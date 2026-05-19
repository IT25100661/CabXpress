package com.cabxpress.controller;

import com.cabxpress.entity.CmsPage;
import com.cabxpress.exception.ApiException;
import com.cabxpress.repository.CmsPageRepository;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/cms/pages")
public class CmsController {
    private final CmsPageRepository pages;
    public CmsController(CmsPageRepository pages) { this.pages = pages; }
    @GetMapping public List<CmsPage> all() { return pages.findAll().stream().filter(page -> page.published).toList(); }
    @GetMapping("/admin") public List<CmsPage> adminAll() { return pages.findAll(); }
    @GetMapping("/{slug}") public CmsPage bySlug(@PathVariable String slug) { return pages.findBySlug(slug).orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "CMS page not found")); }
    @PostMapping public CmsPage create(@RequestBody CmsPage page) { return pages.save(page); }
    @PutMapping("/{id}") public CmsPage update(@PathVariable Long id, @RequestBody CmsPage input) {
        CmsPage page = pages.findById(id).orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "CMS page not found"));
        if (input.slug != null) page.slug = input.slug;
        if (input.title != null) page.title = input.title;
        if (input.content != null) page.content = input.content;
        if (input.metadataJson != null) page.metadataJson = input.metadataJson;
        page.published = input.published;
        return pages.save(page);
    }
    @DeleteMapping("/{id}") public void delete(@PathVariable Long id) { pages.deleteById(id); }
}
