package com.cursr.backend.services;

import java.time.Instant;
import java.util.Map;

public record ServiceResponse(
    String id,
    String serviceName,
    String indexSource,
    String repoUrl,
    String branch,
    String localPath,
    String repoSubpath,
    String status,
    Instant indexedAt,
    Map<String, Object> indexStats,
    String lastIndexJobId,
    Instant createdAt,
    Instant updatedAt,
    boolean discovered,
    boolean repositoryLinked,
    boolean codeSourceLinked,
    String clonePath,
    String indexPath,
    boolean indexed) {

  public static ServiceResponse from(ServiceRecord record) {
    boolean gitLinked = record.repoUrl() != null && !record.repoUrl().isBlank();
    boolean localLinked = record.localPath() != null && !record.localPath().isBlank();
    boolean codeSourceLinked = gitLinked || localLinked;
    boolean indexed = ServiceStatus.INDEXED.equals(record.status());
    String indexSource =
        record.indexSource() != null && !record.indexSource().isBlank()
            ? record.indexSource()
            : (localLinked ? "local" : "git");
    return new ServiceResponse(
        record.id(),
        record.serviceName(),
        indexSource,
        record.repoUrl(),
        record.branch(),
        record.localPath(),
        record.repoSubpath(),
        record.status(),
        record.indexedAt(),
        record.indexStats(),
        record.lastIndexJobId(),
        record.createdAt(),
        record.updatedAt(),
        record.discovered(),
        gitLinked,
        codeSourceLinked,
        gitLinked ? AndromediaPaths.clonePath(record.serviceName()) : null,
        codeSourceLinked ? AndromediaPaths.indexPath(record.serviceName()) : null,
        indexed);
  }
}
