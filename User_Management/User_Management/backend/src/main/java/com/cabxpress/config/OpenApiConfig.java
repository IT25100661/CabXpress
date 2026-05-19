package com.cabxpress.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {
    @Bean
    OpenAPI cabXpressOpenApi() {
        return new OpenAPI().info(new Info()
                .title("CabXpress API")
                .version("1.0.0")
                .description("Taxi and Cab Service Booking Platform REST API"));
    }
}
