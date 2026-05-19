package com.cabxpress.controller;

import com.cabxpress.dto.ApiDtos.RouteResponse;
import com.cabxpress.service.MapsService;
import java.util.Map;
import org.springframework.context.annotation.Profile;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@Profile("!prod")
@RequestMapping("/api/dev/maps")
public class DevMapsController {
    private final MapsService mapsService;

    public DevMapsController(MapsService mapsService) {
        this.mapsService = mapsService;
    }

    @GetMapping("/status")
    public Map<String, Object> status() {
        return mapsService.status();
    }

    @PostMapping("/test-route")
    public RouteResponse testRoute() {
        return mapsService.testRoute();
    }
}
