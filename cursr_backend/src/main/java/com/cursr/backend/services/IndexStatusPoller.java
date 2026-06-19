package com.cursr.backend.services;

import java.time.Instant;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
public class IndexStatusPoller {

  private static final Logger log = LoggerFactory.getLogger(IndexStatusPoller.class);

  private final ServiceRegistryService serviceRegistryService;
  private final AndromediaClient andromediaClient;

  public IndexStatusPoller(
      ServiceRegistryService serviceRegistryService, AndromediaClient andromediaClient) {
    this.serviceRegistryService = serviceRegistryService;
    this.andromediaClient = andromediaClient;
  }

  @Scheduled(fixedDelayString = "${app.andromedia.poll-interval-ms:5000}")
  public void pollIndexingJobs() {
    List<Map<String, Object>> jobs = serviceRegistryService.findIndexingJobs();
    for (Map<String, Object> job : jobs) {
      String serviceName = String.valueOf(job.get("service_name"));
      String jobId = String.valueOf(job.get("last_index_job_id"));
      if (jobId == null || jobId.isBlank() || "null".equals(jobId)) {
        continue;
      }
      Optional<AndromediaClient.IndexJobStatusResponse> status = andromediaClient.getIndexJob(jobId);
      if (status.isEmpty()) {
        continue;
      }
      AndromediaClient.IndexJobStatusResponse response = status.get();
      switch (response.status()) {
        case "completed" -> {
          Map<String, Object> stats =
              response.stats() == null ? Map.of() : new HashMap<>(response.stats());
          serviceRegistryService.updateIndexComplete(
              serviceName, ServiceStatus.INDEXED, Instant.now(), stats);
          log.info("Index completed for service {}", serviceName);
        }
        case "failed" -> {
          Map<String, Object> stats = Map.of("error", response.error() == null ? "unknown" : response.error());
          serviceRegistryService.updateIndexComplete(
              serviceName, ServiceStatus.FAILED, Instant.now(), stats);
          log.warn("Index failed for service {}: {}", serviceName, response.error());
        }
        default -> {
          // still running
        }
      }
    }
  }
}
