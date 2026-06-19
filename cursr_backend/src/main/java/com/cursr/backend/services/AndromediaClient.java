package com.cursr.backend.services;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Optional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

@Component
public class AndromediaClient {

  private static final Logger log = LoggerFactory.getLogger(AndromediaClient.class);

  private final AndromediaProperties properties;
  private final ObjectMapper objectMapper;
  private final HttpClient httpClient;

  public AndromediaClient(AndromediaProperties properties, ObjectMapper objectMapper) {
    this.properties = properties;
    this.objectMapper = objectMapper;
    this.httpClient = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(10)).build();
  }

  public Optional<IndexJobResponse> startIndex(
      String service,
      String repo,
      String branch,
      String localPath,
      String repoSubpath,
      boolean embed) {
    try {
      Map<String, Object> body = new LinkedHashMap<>();
      body.put("service", service);
      body.put("embed", embed);
      if (localPath != null && !localPath.isBlank()) {
        body.put("localPath", localPath);
      } else {
        body.put("repo", repo);
        body.put("branch", branch == null || branch.isBlank() ? "main" : branch);
        if (repoSubpath != null && !repoSubpath.isBlank()) {
          body.put("repoSubpath", repoSubpath);
        }
      }
      HttpRequest request =
          HttpRequest.newBuilder()
              .uri(URI.create(properties.normalizedBaseUrl() + "/api/v1/index"))
              .timeout(Duration.ofSeconds(30))
              .header("Content-Type", "application/json")
              .POST(HttpRequest.BodyPublishers.ofString(objectMapper.writeValueAsString(body)))
              .build();
      HttpResponse<String> response =
          httpClient.send(request, HttpResponse.BodyHandlers.ofString());
      if (response.statusCode() != 202 && response.statusCode() != 200) {
        log.warn("Andromedia index start failed for {}: HTTP {}", service, response.statusCode());
        return Optional.empty();
      }
      return Optional.of(objectMapper.readValue(response.body(), IndexJobResponse.class));
    } catch (Exception ex) {
      log.warn("Andromedia index start failed for {}: {}", service, ex.getMessage());
      return Optional.empty();
    }
  }

  public Optional<IndexJobStatusResponse> getIndexJob(String jobId) {
    try {
      HttpRequest request =
          HttpRequest.newBuilder()
              .uri(URI.create(properties.normalizedBaseUrl() + "/api/v1/index/" + jobId))
              .timeout(Duration.ofSeconds(15))
              .GET()
              .build();
      HttpResponse<String> response =
          httpClient.send(request, HttpResponse.BodyHandlers.ofString());
      if (response.statusCode() != 200) {
        return Optional.empty();
      }
      return Optional.of(objectMapper.readValue(response.body(), IndexJobStatusResponse.class));
    } catch (Exception ex) {
      log.warn("Andromedia index status failed for {}: {}", jobId, ex.getMessage());
      return Optional.empty();
    }
  }

  public Optional<InvestigateResponse> investigate(
      String service, String query, Map<String, Object> context) {
    try {
      Map<String, Object> body = Map.of("service", service, "query", query, "context", context);
      HttpRequest request =
          HttpRequest.newBuilder()
              .uri(URI.create(properties.normalizedBaseUrl() + "/api/v1/investigate"))
              .timeout(Duration.ofMinutes(3))
              .header("Content-Type", "application/json")
              .POST(HttpRequest.BodyPublishers.ofString(objectMapper.writeValueAsString(body)))
              .build();
      HttpResponse<String> response =
          httpClient.send(request, HttpResponse.BodyHandlers.ofString());
      if (response.statusCode() != 200) {
        log.warn("Andromedia investigate failed for {}: HTTP {}", service, response.statusCode());
        return Optional.empty();
      }
      return Optional.of(objectMapper.readValue(response.body(), InvestigateResponse.class));
    } catch (Exception ex) {
      log.warn("Andromedia investigate failed for {}: {}", service, ex.getMessage());
      return Optional.empty();
    }
  }

  public record IndexJobResponse(String jobId, String service, String status) {}

  public record IndexJobStatusResponse(
      String jobId,
      String service,
      String status,
      Map<String, Object> stats,
      String error) {}

  public record InvestigateResponse(String summary, String details, Map<String, Object> metadata) {}
}
