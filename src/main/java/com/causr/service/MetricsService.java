package com.causr.service;

import java.util.concurrent.atomic.AtomicLong;

import org.springframework.stereotype.Service;

@Service
public class MetricsService {

    private final AtomicLong totalRequests =
            new AtomicLong();

    private final AtomicLong errorRequests =
            new AtomicLong();

    public void incrementRequest() {
        totalRequests.incrementAndGet();
    }

    public void incrementError() {
        errorRequests.incrementAndGet();
    }

    public long getTotalRequests() {
        return totalRequests.get();
    }

    public long getErrorRequests() {
        return errorRequests.get();
    }

    public void reset() {
        totalRequests.set(0);
        errorRequests.set(0);
    }
}