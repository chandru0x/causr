package com.cursr.backend.services;

import java.time.Instant;
import java.util.Map;

public record ServiceRecord(
    String id,
    String serviceName,
    String repoUrl,
    String branch,
    String status,
    Instant indexedAt,
    Map<String, Object> indexStats,
    String lastIndexJobId,
    Instant createdAt,
    Instant updatedAt,
    boolean discovered) {}
