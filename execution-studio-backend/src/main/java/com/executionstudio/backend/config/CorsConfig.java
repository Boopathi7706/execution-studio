package com.executionstudio.backend.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * Global Cross-Origin Resource Sharing (CORS) Configuration.
 *
 * Configures Spring Web MVC to allow browser HTTP requests originating from
 * the React frontend application (http://localhost:5173).
 */
@Configuration
public class CorsConfig implements WebMvcConfigurer {

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/**")
                // 1. Target Origin: Allows requests from Vite React frontend
                .allowedOrigins("http://localhost:5173")
                // 2. HTTP Methods: Permits REST verbs and preflight OPTIONS check
                .allowedMethods("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS")
                // 3. HTTP Headers: Accepts all request headers from client
                .allowedHeaders("*")
                // 4. Credentials: Set to false as session cookies are not required
                .allowCredentials(false)
                // 5. Preflight Cache: Caches preflight OPTIONS check for 1 hour (3600 seconds)
                .maxAge(3600);
    }
}
