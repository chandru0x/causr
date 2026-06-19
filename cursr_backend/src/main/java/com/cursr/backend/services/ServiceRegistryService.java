package com.cursr.backend.services;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.sql.Timestamp;
import java.time.Instant;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

@Service
public class ServiceRegistryService {

  private final JdbcTemplate clickHouseJdbcTemplate;
  private final JdbcTemplate postgresJdbcTemplate;
  private final ObjectMapper objectMapper;

  public ServiceRegistryService(
      JdbcTemplate clickHouseJdbcTemplate,
      @Qualifier("postgresJdbcTemplate") JdbcTemplate postgresJdbcTemplate,
      ObjectMapper objectMapper) {
    this.clickHouseJdbcTemplate = clickHouseJdbcTemplate;
    this.postgresJdbcTemplate = postgresJdbcTemplate;
    this.objectMapper = objectMapper;
  }

  public List<ServiceRecord> listMerged() {
    Set<String> discovered = discoverServiceNames();
    Map<String, ServiceRecord> registry = loadRegistryByName();
    List<ServiceRecord> merged = new ArrayList<>();
    for (String name : discovered) {
      ServiceRecord existing = registry.remove(name);
      if (existing != null) {
        merged.add(withDiscovered(existing, true));
      } else {
        merged.add(discoveredOnly(name));
      }
    }
    registry.values().stream()
        .sorted((a, b) -> a.serviceName().compareToIgnoreCase(b.serviceName()))
        .forEach(merged::add);
    return merged;
  }

  public Optional<ServiceRecord> findMerged(String serviceName) {
    if (serviceName == null || serviceName.isBlank()) {
      return Optional.empty();
    }
    Optional<ServiceRecord> registry = findRegistry(serviceName);
    boolean discovered = discoverServiceNames().contains(serviceName);
    if (registry.isPresent()) {
      return Optional.of(withDiscovered(registry.get(), discovered));
    }
    if (discovered) {
      return Optional.of(discoveredOnly(serviceName));
    }
    return Optional.empty();
  }

  public ServiceRecord upsertCodeSource(
      String serviceName,
      String indexSource,
      String repoUrl,
      String branch,
      String localPath,
      String repoSubpath,
      String status) {
    String normalizedSource = normalizeIndexSource(indexSource);
    List<Map<String, Object>> rows =
        postgresJdbcTemplate.queryForList(
            ServicesSql.UPSERT,
            serviceName,
            normalizedSource,
            "git".equals(normalizedSource) ? repoUrl : null,
            "git".equals(normalizedSource)
                ? (branch == null || branch.isBlank() ? "main" : branch.trim())
                : "main",
            "local".equals(normalizedSource) ? localPath : null,
            "git".equals(normalizedSource) ? stringOrNull(repoSubpath) : null,
            status);
    return mapRow(rows.getFirst(), discoverServiceNames().contains(serviceName));
  }

  public void updateIndexJob(String serviceName, String jobId, String status) {
    postgresJdbcTemplate.update(ServicesSql.UPDATE_INDEX_JOB, jobId, status, serviceName);
  }

  public void updateIndexComplete(
      String serviceName, String status, Instant indexedAt, Map<String, Object> stats) {
    String json;
    try {
      json = objectMapper.writeValueAsString(stats == null ? Map.of() : stats);
    } catch (Exception ex) {
      json = "{}";
    }
    postgresJdbcTemplate.update(
        ServicesSql.UPDATE_INDEX_COMPLETE,
        status,
        Timestamp.from(indexedAt),
        json,
        serviceName);
  }

  public List<Map<String, Object>> findIndexingJobs() {
    return postgresJdbcTemplate.queryForList(ServicesSql.FIND_INDEXING);
  }

  private Set<String> discoverServiceNames() {
    List<Map<String, Object>> rows =
        clickHouseJdbcTemplate.queryForList(ServicesSql.DISCOVERED_SERVICE_NAMES);
    Set<String> names = new LinkedHashSet<>();
    for (Map<String, Object> row : rows) {
      Object value = row.get("service_name");
      if (value != null) {
        String name = String.valueOf(value).trim();
        if (!name.isEmpty()) {
          names.add(name);
        }
      }
    }
    return names;
  }

  private Map<String, ServiceRecord> loadRegistryByName() {
    List<Map<String, Object>> rows = postgresJdbcTemplate.queryForList(ServicesSql.FIND_ALL);
    Map<String, ServiceRecord> byName = new LinkedHashMap<>();
    for (Map<String, Object> row : rows) {
      ServiceRecord record = mapRow(row, false);
      byName.put(record.serviceName(), record);
    }
    return byName;
  }

  private Optional<ServiceRecord> findRegistry(String serviceName) {
    List<Map<String, Object>> rows =
        postgresJdbcTemplate.queryForList(ServicesSql.FIND_BY_NAME, serviceName);
    if (rows.isEmpty()) {
      return Optional.empty();
    }
    return Optional.of(mapRow(rows.getFirst(), false));
  }

  private ServiceRecord discoveredOnly(String serviceName) {
    return new ServiceRecord(
        null,
        serviceName,
        "git",
        null,
        "main",
        null,
        null,
        ServiceStatus.DISCOVERED,
        null,
        Map.of(),
        null,
        null,
        null,
        true);
  }

  private ServiceRecord withDiscovered(ServiceRecord record, boolean discovered) {
    return new ServiceRecord(
        record.id(),
        record.serviceName(),
        record.indexSource(),
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
        discovered);
  }

  private ServiceRecord mapRow(Map<String, Object> row, boolean discovered) {
    return new ServiceRecord(
        stringOrNull(row.get("id")),
        String.valueOf(row.get("service_name")),
        stringOrNull(row.get("index_source")) != null
            ? String.valueOf(row.get("index_source"))
            : "git",
        stringOrNull(row.get("repo_url")),
        stringOrNull(row.get("branch")) != null ? String.valueOf(row.get("branch")) : "main",
        stringOrNull(row.get("local_path")),
        stringOrNull(row.get("repo_subpath")),
        String.valueOf(row.getOrDefault("status", ServiceStatus.DISCOVERED)),
        toInstant(row.get("indexed_at")),
        parseStats(row.get("index_stats")),
        stringOrNull(row.get("last_index_job_id")),
        toInstant(row.get("created_at")),
        toInstant(row.get("updated_at")),
        discovered);
  }

  private Map<String, Object> parseStats(Object raw) {
    if (raw == null) {
      return Map.of();
    }
    String text = String.valueOf(raw).trim();
    if (text.isEmpty() || "null".equals(text)) {
      return Map.of();
    }
    try {
      return objectMapper.readValue(text, new TypeReference<>() {});
    } catch (Exception ex) {
      return Map.of();
    }
  }

  private static String normalizeIndexSource(String indexSource) {
    if (indexSource == null || indexSource.isBlank()) {
      return "git";
    }
    String normalized = indexSource.trim().toLowerCase();
    if (!"git".equals(normalized) && !"local".equals(normalized)) {
      throw new IllegalArgumentException("indexSource must be git or local");
    }
    return normalized;
  }

  private static Instant toInstant(Object value) {
    if (value == null) {
      return null;
    }
    if (value instanceof Instant instant) {
      return instant;
    }
    if (value instanceof Timestamp timestamp) {
      return timestamp.toInstant();
    }
    return null;
  }

  private static String stringOrNull(Object value) {
    if (value == null) {
      return null;
    }
    String text = String.valueOf(value).trim();
    return text.isEmpty() ? null : text;
  }
}
