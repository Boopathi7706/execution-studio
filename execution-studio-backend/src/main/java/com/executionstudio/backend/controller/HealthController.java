package com.executionstudio.backend.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/health")
public class HealthController {

    @GetMapping
    public Map<String, Object> getHealth() {
        return Map.of(
            "status", "UP",
            "application", "Execution Studio Backend",
            "version", "1.0.0"
        );
    }
}
