package com.cabxpress.service;

import com.cabxpress.dto.ApiDtos.DistanceRequest;
import com.cabxpress.dto.ApiDtos.RouteResponse;
import com.cabxpress.exception.ApiException;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.annotation.PostConstruct;
import java.net.URI;
import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;
import org.springframework.web.util.UriComponentsBuilder;

@Service
public class MapsService {
    private static final Logger log = LoggerFactory.getLogger(MapsService.class);

    @Value("${app.mock-maps}") private boolean mockMaps;
    @Value("${openroute.api.key}") private String openRouteApiKey;
    @Value("${openroute.base-url}") private String openRouteBaseUrl;
    @Value("${osrm.base-url}") private String osrmBaseUrl;
    private final WebClient webClient = WebClient.builder()
            .codecs(configurer -> configurer.defaultCodecs().maxInMemorySize(2 * 1024 * 1024))
            .build();
    private final ObjectMapper objectMapper = new ObjectMapper();

    @PostConstruct
    void logConfiguration() {
        log.info("Maps configuration: MOCK_MAPS={}, OpenRoute key present={}, ORS_BASE_URL={}, OSRM_BASE_URL={}",
                mockMaps, openRouteApiKeyPresent(), openRouteBaseUrl, osrmBaseUrl);
    }

    public List<Map<String, Object>> search(String query) {
        String q = query == null ? "" : query.trim();
        if (q.length() < 2) throw new ApiException(HttpStatus.BAD_REQUEST, "Search query must contain at least 2 characters");
        if (mockMaps) {
            log.info("Maps search provider selected: LOCAL (MOCK_MAPS=true)");
            return localSuggestions(q, "MOCK_MAPS enabled; using local map suggestions.");
        }
        if (openRouteApiKeyPresent()) {
            try {
                List<Map<String, Object>> results = openRouteSearch(q);
                if (!results.isEmpty()) {
                    log.info("Maps search provider selected: OPENROUTE");
                    return results;
                }
                log.warn("OpenRoute search returned no results for query '{}'; falling back to LOCAL", q);
                log.info("Maps search provider selected: LOCAL");
                return localSuggestions(q, "OpenRoute returned no results; using local map suggestions.");
            } catch (RuntimeException ex) {
                String warning = "OpenRoute search failed: " + errorMessage(ex);
                log.warn("{}; falling back to LOCAL", warning);
                log.info("Maps search provider selected: LOCAL");
                return localSuggestions(q, warning);
            }
        }
        log.warn("OpenRoute API key is not configured; falling back to LOCAL search");
        log.info("Maps search provider selected: LOCAL");
        return localSuggestions(q, "OpenRoute API key is not configured; using local map suggestions.");
    }

    public RouteResponse distance(DistanceRequest request) {
        validateCoordinates(request);
        if (!mockMaps) {
            if (openRouteApiKeyPresent()) {
                try {
                    RouteResponse response = openRouteDirections(request, false);
                    log.info("Maps route provider selected: OPENROUTE");
                    return response;
                } catch (RuntimeException ex) {
                    log.warn("OpenRoute route failed: {}; trying OSRM", errorMessage(ex));
                }
            } else {
                log.warn("OpenRoute API key is not configured; trying OSRM");
            }
            try {
                RouteResponse response = osrmRoute(request);
                log.info("Maps route provider selected: OSRM");
                return response;
            } catch (RuntimeException ex) {
                log.warn("OSRM route failed: {}; falling back to LOCAL", errorMessage(ex));
            }
        }
        RouteResponse response = fallbackRoute(request, false);
        log.info("Maps route provider selected: {}", response.provider());
        return response;
    }

    public RouteResponse route(DistanceRequest request) {
        validateCoordinates(request);
        if (!mockMaps) {
            if (openRouteApiKeyPresent()) {
                try {
                    RouteResponse response = openRouteDirections(request, true);
                    log.info("Maps route provider selected: OPENROUTE");
                    return response;
                } catch (RuntimeException ex) {
                    log.warn("OpenRoute route failed: {}; trying OSRM", errorMessage(ex));
                }
            } else {
                log.warn("OpenRoute API key is not configured; trying OSRM");
            }
            try {
                RouteResponse response = osrmRoute(request);
                log.info("Maps route provider selected: OSRM");
                return response;
            } catch (RuntimeException ex) {
                log.warn("OSRM route failed: {}; falling back to LOCAL", errorMessage(ex));
            }
        }
        RouteResponse response = fallbackRoute(request, true);
        log.info("Maps route provider selected: {}", response.provider());
        return response;
    }

    public Map<String, Object> status() {
        return Map.of(
                "mockMapsEnabled", mockMaps,
                "openRouteApiKeyPresent", openRouteApiKeyPresent(),
                "orsBaseUrl", openRouteBaseUrl,
                "osrmBaseUrl", osrmBaseUrl,
                "providerPriority", providerPriority()
        );
    }

    public RouteResponse testRoute() {
        return route(new DistanceRequest(6.9344, 79.8428, 7.181211, 79.890595));
    }

    private List<String> providerPriority() {
        if (mockMaps) return List.of("LOCAL");
        if (openRouteApiKeyPresent()) return List.of("OPENROUTE", "OSRM", "LOCAL");
        return List.of("OSRM", "LOCAL");
    }

    private boolean openRouteApiKeyPresent() {
        return StringUtils.hasText(openRouteApiKey);
    }

    private List<Map<String, Object>> localSuggestions(String query, String warning) {
        String normalized = query.toLowerCase();
        List<Map<String, Object>> locations = List.of(
                suggestion("fort-colombo", "Colombo Fort, Colombo", 6.9344, 79.8428, "Colombo", warning),
                suggestion("ccc-colombo", "Colombo City Centre, Colombo", 6.9177, 79.8649, "Colombo", warning),
                suggestion("airport-bia", "Bandaranaike Airport, Katunayake", 7.1808, 79.8841, "Katunayake", warning),
                suggestion("havelock", "Havelock City, Colombo", 6.8876, 79.8612, "Colombo", warning),
                suggestion("pettah", "Pettah, Colombo", 6.9368, 79.8500, "Colombo", warning),
                suggestion("galle-face", "Galle Face, Colombo", 6.9271, 79.8412, "Colombo", warning)
        );
        List<Map<String, Object>> matches = locations.stream()
                .filter(item -> String.valueOf(item.get("displayName")).toLowerCase().contains(normalized)
                        || String.valueOf(item.get("city")).toLowerCase().contains(normalized)
                        || String.valueOf(item.get("id")).toLowerCase().contains(normalized))
                .limit(5)
                .toList();
        return matches.isEmpty() ? locations.stream().limit(3).toList() : matches;
    }

    private Map<String, Object> suggestion(String id, String displayName, double latitude, double longitude, String city, String warning) {
        return Map.of("id", id, "displayName", displayName, "latitude", latitude, "longitude", longitude,
                "city", city, "provider", "LOCAL", "warning", warning, "raw", displayName);
    }

    @SuppressWarnings("unchecked")
    private RouteResponse openRouteDirections(DistanceRequest request, boolean includeGeometry) {
        URI uri = UriComponentsBuilder.fromHttpUrl(openRouteBaseUrl)
                .path("/v2/directions/driving-car")
                .queryParam("start", request.pickupLongitude() + "," + request.pickupLatitude())
                .queryParam("end", request.dropLongitude() + "," + request.dropLatitude())
                .build()
                .toUri();
        Map<String, Object> response = webClient.get().uri(uri)
                .header("Authorization", openRouteApiKey)
                .retrieve().bodyToMono(Map.class).block(Duration.ofSeconds(8));
        if (response == null || !response.containsKey("features")) throw new IllegalStateException("OpenRoute response missing features");
        List<Map<String, Object>> features = (List<Map<String, Object>>) response.get("features");
        if (features.isEmpty()) throw new IllegalStateException("OpenRoute response contains no route features");
        Map<String, Object> feature = features.get(0);
        Map<String, Object> properties = (Map<String, Object>) feature.get("properties");
        Map<String, Object> summary = (Map<String, Object>) properties.get("summary");
        
        double km = ((Number) summary.get("distance")).doubleValue() / 1000.0;
        double minutes = ((Number) summary.get("duration")).doubleValue() / 60.0;
        Object geometry = includeGeometry ? feature.get("geometry") : null;
        return new RouteResponse(round(km), round(minutes), stringifyGeometry(geometry), "OPENROUTE", false, null);
    }

    @SuppressWarnings("unchecked")
    private List<Map<String, Object>> openRouteSearch(String query) {
        URI uri = UriComponentsBuilder.fromHttpUrl(openRouteBaseUrl)
                .path("/geocode/search")
                .queryParam("text", query)
                .queryParam("size", 5)
                .queryParam("boundary.country", "LK")
                .build()
                .toUri();
        Map<String, Object> response = webClient.get().uri(uri)
                .header("Authorization", openRouteApiKey)
                .retrieve().bodyToMono(Map.class).block(Duration.ofSeconds(8));
        List<Map<String, Object>> features = response == null ? List.of() : (List<Map<String, Object>>) response.getOrDefault("features", List.of());
        List<Map<String, Object>> suggestions = new ArrayList<>();
        for (Map<String, Object> feature : features) {
            Map<String, Object> properties = (Map<String, Object>) feature.getOrDefault("properties", Map.of());
            Map<String, Object> geometry = (Map<String, Object>) feature.getOrDefault("geometry", Map.of());
            List<Number> coordinates = (List<Number>) geometry.getOrDefault("coordinates", List.of());
            if (coordinates.size() >= 2) {
                suggestions.add(Map.of(
                        "id", String.valueOf(properties.getOrDefault("id", properties.getOrDefault("gid", properties.getOrDefault("label", query)))),
                        "displayName", properties.getOrDefault("label", properties.getOrDefault("name", query)),
                        "latitude", coordinates.get(1).doubleValue(),
                        "longitude", coordinates.get(0).doubleValue(),
                        "city", properties.getOrDefault("locality", properties.getOrDefault("county", "")),
                        "provider", "OPENROUTE",
                        "raw", properties
                ));
            }
        }
        return suggestions;
    }

    @SuppressWarnings("unchecked")
    private RouteResponse osrmRoute(DistanceRequest request) {
        URI uri = UriComponentsBuilder.fromHttpUrl(osrmBaseUrl)
                .path("/route/v1/driving/{pickupLon},{pickupLat};{dropLon},{dropLat}")
                .queryParam("overview", "full")
                .queryParam("geometries", "geojson")
                .build(request.pickupLongitude(), request.pickupLatitude(), request.dropLongitude(), request.dropLatitude());
        Map<String, Object> response = webClient.get().uri(uri).retrieve().bodyToMono(Map.class).block(Duration.ofSeconds(8));
        if (response == null || !response.containsKey("routes")) throw new IllegalStateException("OSRM response missing routes");
        List<Map<String, Object>> routes = (List<Map<String, Object>>) response.get("routes");
        if (routes.isEmpty()) throw new IllegalStateException("OSRM response contains no routes");
        Map<String, Object> first = routes.get(0);
        double km = ((Number) first.get("distance")).doubleValue() / 1000.0;
        double minutes = ((Number) first.get("duration")).doubleValue() / 60.0;
        Object geometry = first.get("geometry");
        return new RouteResponse(round(km), round(minutes), stringifyGeometry(geometry), "OSRM", false, null);
    }

    private RouteResponse fallbackRoute(DistanceRequest request, boolean includeGeometry) {
        double km = haversine(request.pickupLatitude(), request.pickupLongitude(), request.dropLatitude(), request.dropLongitude());
        double minutes = Math.max(8, km / 32.0 * 60.0);
        String geometry = includeGeometry
                ? "[[%f,%f],[%f,%f]]".formatted(request.pickupLongitude(), request.pickupLatitude(), request.dropLongitude(), request.dropLatitude())
                : null;
        return new RouteResponse(round(km), round(minutes), geometry, "HAVERSINE_FALLBACK", true,
                "Route provider unavailable; using estimated road distance.");
    }

    private void validateCoordinates(DistanceRequest request) {
        if (!validLat(request.pickupLatitude()) || !validLat(request.dropLatitude())
                || !validLon(request.pickupLongitude()) || !validLon(request.dropLongitude())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Invalid pickup or destination coordinates");
        }
        if (request.pickupLatitude() == request.dropLatitude() && request.pickupLongitude() == request.dropLongitude()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Pickup and destination must be different");
        }
    }

    private boolean validLat(double value) {
        return value >= -90 && value <= 90;
    }

    private boolean validLon(double value) {
        return value >= -180 && value <= 180;
    }

    private double haversine(double lat1, double lon1, double lat2, double lon2) {
        double radius = 6371.0;
        double dLat = Math.toRadians(lat2 - lat1);
        double dLon = Math.toRadians(lon2 - lon1);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                * Math.sin(dLon / 2) * Math.sin(dLon / 2);
        return radius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    }

    private double round(double value) {
        return Math.round(value * 100.0) / 100.0;
    }

    private String stringifyGeometry(Object geometry) {
        if (geometry == null) return null;
        if (geometry instanceof String string) return string;
        try {
            return objectMapper.writeValueAsString(geometry);
        } catch (Exception ignored) {
            return String.valueOf(geometry);
        }
    }

    private String errorMessage(RuntimeException ex) {
        if (ex instanceof WebClientResponseException responseException) {
            String body = responseException.getResponseBodyAsString();
            if (StringUtils.hasText(body)) {
                return responseException.getStatusCode() + " " + body;
            }
            return responseException.getStatusCode().toString();
        }
        return StringUtils.hasText(ex.getMessage()) ? ex.getMessage() : ex.getClass().getSimpleName();
    }
}
