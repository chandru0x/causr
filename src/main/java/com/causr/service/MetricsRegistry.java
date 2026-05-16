package com.causr.service;

import java.util.concurrent.ConcurrentHashMap;

import org.springframework.stereotype.Service;

import com.causr.dto.ServiceMetrics;

@Service
public class MetricsRegistry {

    private final ConcurrentHashMap<
            String,
            ServiceMetrics
    > metricsMap = new ConcurrentHashMap<>();

    public ServiceMetrics getMetrics(
            String serviceName) {

        return metricsMap.computeIfAbsent(
                serviceName,
                k -> new ServiceMetrics()
        );
    }

    public ConcurrentHashMap<String, ServiceMetrics>
    getAllMetrics() {

        return metricsMap;
    }
}