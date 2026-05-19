package com.cabxpress.controller;

import java.util.Map;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/uploads")
public class UploadController {
    private final VehicleController vehicleController;

    public UploadController(VehicleController vehicleController) {
        this.vehicleController = vehicleController;
    }

    @PostMapping(value = "/vehicles", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public Map<String, String> uploadVehicleImage(@RequestParam("file") MultipartFile file) {
        return Map.of("url", vehicleController.storeVehicleImage(file));
    }
}
