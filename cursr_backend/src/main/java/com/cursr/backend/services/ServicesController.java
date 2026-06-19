package com.cursr.backend.services;

import jakarta.validation.Valid;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/services")
public class ServicesController {

  private final ServiceRegistryService serviceRegistryService;
  private final AndromediaClient andromediaClient;

  public ServicesController(
      ServiceRegistryService serviceRegistryService, AndromediaClient andromediaClient) {
    this.serviceRegistryService = serviceRegistryService;
    this.andromediaClient = andromediaClient;
  }

  @GetMapping
  public List<ServiceResponse> list() {
    return serviceRegistryService.listMerged().stream().map(ServiceResponse::from).toList();
  }

  @GetMapping("/{serviceName}")
  public ResponseEntity<ServiceResponse> get(@PathVariable String serviceName) {
    return serviceRegistryService
        .findMerged(serviceName)
        .map(ServiceResponse::from)
        .map(ResponseEntity::ok)
        .orElse(ResponseEntity.notFound().build());
  }

  @PutMapping("/{serviceName}")
  public ResponseEntity<ServiceResponse> upsert(
      @PathVariable String serviceName, @Valid @RequestBody UpdateServiceRequest request) {
    if (serviceName == null || serviceName.isBlank()) {
      return ResponseEntity.badRequest().build();
    }
    String indexSource =
        request.indexSource() == null || request.indexSource().isBlank()
            ? "git"
            : request.indexSource().trim().toLowerCase();
    if ("local".equals(indexSource)) {
      if (request.localPath() == null || request.localPath().isBlank()) {
        return ResponseEntity.badRequest().build();
      }
    } else if (request.repoUrl() == null || request.repoUrl().isBlank()) {
      return ResponseEntity.badRequest().build();
    } else {
      indexSource = "git";
    }

    ServiceRecord saved =
        serviceRegistryService.upsertCodeSource(
            serviceName.trim(),
            indexSource,
            request.repoUrl() != null ? request.repoUrl().trim() : null,
            request.branch(),
            request.localPath() != null ? request.localPath().trim() : null,
            request.repoSubpath(),
            ServiceStatus.INDEXING);

    Optional<AndromediaClient.IndexJobResponse> job =
        "local".equals(indexSource)
            ? andromediaClient.startIndex(
                saved.serviceName(), null, null, saved.localPath(), null, true)
            : andromediaClient.startIndex(
                saved.serviceName(),
                saved.repoUrl(),
                saved.branch(),
                null,
                saved.repoSubpath(),
                true);

    if (job.isPresent()) {
      serviceRegistryService.updateIndexJob(
          saved.serviceName(), job.get().jobId(), ServiceStatus.INDEXING);
      return serviceRegistryService
          .findMerged(saved.serviceName())
          .map(ServiceResponse::from)
          .map(body -> ResponseEntity.status(HttpStatus.ACCEPTED).body(body))
          .orElse(ResponseEntity.status(HttpStatus.ACCEPTED).build());
    }
    serviceRegistryService.updateIndexComplete(
        saved.serviceName(), ServiceStatus.FAILED, java.time.Instant.now(), Map.of("error", "index start failed"));
    return serviceRegistryService
        .findMerged(saved.serviceName())
        .map(ServiceResponse::from)
        .map(ResponseEntity::ok)
        .orElse(ResponseEntity.internalServerError().build());
  }

  @PostMapping("/{serviceName}/reindex")
  public ResponseEntity<ServiceResponse> reindex(@PathVariable String serviceName) {
    Optional<ServiceRecord> existing = serviceRegistryService.findMerged(serviceName);
    if (existing.isEmpty()) {
      return ResponseEntity.notFound().build();
    }
    ServiceRecord record = existing.get();
    String indexSource =
        record.indexSource() != null && !record.indexSource().isBlank()
            ? record.indexSource()
            : "git";
    if ("local".equals(indexSource)) {
      if (record.localPath() == null || record.localPath().isBlank()) {
        return ResponseEntity.badRequest().build();
      }
    } else if (record.repoUrl() == null || record.repoUrl().isBlank()) {
      return ResponseEntity.badRequest().build();
    }

    serviceRegistryService.updateIndexJob(record.serviceName(), null, ServiceStatus.INDEXING);
    Optional<AndromediaClient.IndexJobResponse> job =
        "local".equals(indexSource)
            ? andromediaClient.startIndex(
                record.serviceName(), null, null, record.localPath(), null, true)
            : andromediaClient.startIndex(
                record.serviceName(),
                record.repoUrl(),
                record.branch(),
                null,
                record.repoSubpath(),
                true);
    if (job.isEmpty()) {
      serviceRegistryService.updateIndexComplete(
          record.serviceName(),
          ServiceStatus.FAILED,
          java.time.Instant.now(),
          Map.of("error", "reindex start failed"));
      return ResponseEntity.status(HttpStatus.BAD_GATEWAY).build();
    }
    serviceRegistryService.updateIndexJob(
        record.serviceName(), job.get().jobId(), ServiceStatus.INDEXING);
    return serviceRegistryService
        .findMerged(record.serviceName())
        .map(ServiceResponse::from)
        .map(body -> ResponseEntity.status(HttpStatus.ACCEPTED).body(body))
        .orElse(ResponseEntity.status(HttpStatus.ACCEPTED).build());
  }

  @PostMapping("/{serviceName}/investigate")
  public ResponseEntity<AndromediaClient.InvestigateResponse> investigate(
      @PathVariable String serviceName, @RequestBody(required = false) Map<String, Object> body) {
    Optional<ServiceRecord> existing = serviceRegistryService.findMerged(serviceName);
    if (existing.isEmpty()) {
      return ResponseEntity.notFound().build();
    }
    ServiceRecord record = existing.get();
    if (!ServiceStatus.INDEXED.equals(record.status())) {
      return ResponseEntity.status(HttpStatus.CONFLICT).build();
    }
    String query =
        body != null && body.get("query") != null
            ? String.valueOf(body.get("query"))
            : "Investigate recent anomalies for " + serviceName;
    @SuppressWarnings("unchecked")
    Map<String, Object> context =
        body != null && body.get("context") instanceof Map<?, ?> map
            ? (Map<String, Object>) map
            : Map.of();
    return andromediaClient
        .investigate(serviceName, query, context)
        .map(ResponseEntity::ok)
        .orElse(ResponseEntity.status(HttpStatus.BAD_GATEWAY).build());
  }
}
