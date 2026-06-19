package com.cursr.backend.services;

import java.time.Instant;
import java.util.Map;

public record ServiceResponse(
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
    boolean discovered,
    boolean repositoryLinked,
    boolean indexed) {

  public static ServiceResponse from(ServiceRecord record) {
    boolean linked = record.repoUrl() != null && !record.repoUrl().isBlank();
    boolean indexed = ServiceStatus.INDEXED.equals(record.status());
    return new ServiceResponse(
        record.id(),
        record.serviceName(),
        record.repoUrl(),
        record.branch(),
        record.status(),
        record.indexedAt(),
        record.indexStats(),
        record.lastIndexJobId(),
        record.createdAt(),
        record.updatedAt(),
        record.discovered(),
        linked,
        indexed);
  }
}
