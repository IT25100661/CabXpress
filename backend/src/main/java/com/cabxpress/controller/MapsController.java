package com.cabxpress.controller;

import com.cabxpress.dto.ApiDtos.DistanceRequest;
import com.cabxpress.dto.ApiDtos.RouteResponse;
import com.cabxpress.service.MapsService;
import java.util.List;
import java.util.Map;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/maps")
public class MapsController {
    private final MapsService mapsService;
    public MapsController(MapsService mapsService) { this.mapsService = mapsService; }
    @GetMapping("/search") public List<Map<String, Object>> search(@RequestParam String query) { return mapsService.search(query); }
    @PostMapping("/distance") public RouteResponse distance(@RequestBody DistanceRequest request) { return mapsService.distance(request); }
    @PostMapping("/route") public RouteResponse route(@RequestBody DistanceRequest request) { return mapsService.route(request); }
}
