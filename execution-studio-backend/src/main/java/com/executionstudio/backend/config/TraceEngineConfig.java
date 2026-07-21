package com.executionstudio.backend.config;

import com.executionstudio.api.TraceEngine;
import com.executionstudio.service.DefaultTraceEngine;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class TraceEngineConfig {

    @Bean
    public TraceEngine traceEngine() {
        return new DefaultTraceEngine();
    }
}
