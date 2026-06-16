package com.cursr.backend.dashboard;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

@Service
public class DashboardQueryService {

  private final JdbcTemplate jdbcTemplate;
  private final RedisTemplate<String, Object> redisTemplate;

  public DashboardQueryService(
      JdbcTemplate jdbcTemplate,
      RedisTemplate<String, Object> redisTemplate) {
    this.jdbcTemplate = jdbcTemplate;
    this.redisTemplate = redisTemplate;
  }

  public List<Map<String, Object>> errorRateLast5Min() {
    return cachedListOrQuery(DashboardCacheKeys.ERROR_RATE, DashboardSql.ERROR_RATE_LAST_5_MIN);
  }

  public List<Map<String, Object>> p95LatencyLast5Min() {
    return cachedListOrQuery(DashboardCacheKeys.LATENCY, DashboardSql.P95_LATENCY_LAST_5_MIN);
  }

  public List<Map<String, Object>> topErrors30mWithTrend() {
    return cachedListOrQuery(DashboardCacheKeys.TOP_ERRORS, DashboardSql.TOP_ERRORS_30M_WITH_TREND);
  }

  public List<Map<String, Object>> errorRateGlobalWindows() {
    return cachedList(DashboardCacheKeys.ERROR_RATE_GLOBAL);
  }

  public List<Map<String, Object>> p99GlobalWindows() {
    return cachedList(DashboardCacheKeys.P99_GLOBAL);
  }

  public List<Map<String, Object>> rpmGlobalWindows() {
    return cachedList(DashboardCacheKeys.RPM_GLOBAL);
  }

  public List<Map<String, Object>> serviceHealthFromLogs5m() {
    return cachedListOrQuery(DashboardCacheKeys.SERVICE_HEALTH_LOGS, DashboardSql.SERVICE_HEALTH_FROM_LOGS_5M);
  }

  public List<Map<String, Object>> lastAnomalyTimeToDetect() {
    return cachedList(DashboardCacheKeys.LAST_ANOMALY_TTD);
  }

  /**
   * Filtered log lines for drill-down from top errors. Parameters are bound; {@code messageSubstring}
   * is matched with {@code positionCaseInsensitive} (no LIKE wildcards).
   */
  public List<Map<String, Object>> searchLogsByServiceMessage(
      String serviceName, String messageSubstring, int minutes, String logLevelOrNull, int limit) {
    int safeMinutes = Math.max(1, Math.min(24 * 60, minutes));
    int lookbackSeconds = safeMinutes * 60;
    int safeLimit = Math.max(1, Math.min(500, limit));
    String level = logLevelOrNull == null ? "" : logLevelOrNull.trim();
    if (level.isEmpty()) {
      return jdbcTemplate.queryForList(
          DashboardSql.LOGS_SEARCH_BY_SERVICE_MESSAGE,
          lookbackSeconds,
          serviceName,
          messageSubstring,
          safeLimit);
    }
    return jdbcTemplate.queryForList(
        DashboardSql.LOGS_SEARCH_BY_SERVICE_MESSAGE_LEVEL,
        lookbackSeconds,
        serviceName,
        messageSubstring,
        level,
        safeLimit);
  }

  /**
   * Trace drill-down: {@code spans} from {@code observability.spans}, {@code logs} from {@code logs_hot}
   * (same trace_id).
   */
  public Map<String, Object> traceCombined(String traceId) {
    List<Map<String, Object>> logs =
        jdbcTemplate.queryForList(DashboardSql.TRACE_LOGS_BY_TRACE_ID, traceId);
    List<Map<String, Object>> spans =
        jdbcTemplate.queryForList(DashboardSql.TRACE_SPANS_BY_TRACE_ID, traceId);
    Map<String, Object> out = new LinkedHashMap<>();
    out.put("spans", spans);
    out.put("logs", logs);
    return out;
  }

  public List<Map<String, Object>> failureRiskLast10Min() {
    return cachedList(DashboardCacheKeys.RISK);
  }

  public List<Map<String, Object>> topErrorClusters() {
    return cachedListOrQuery(DashboardCacheKeys.ERROR_CLUSTERS, DashboardSql.TOP_ERROR_CLUSTERS);
  }

  public List<Map<String, Object>> serviceMetricsRecent() {
    return cachedListOrQuery(
        DashboardCacheKeys.SERVICE_METRICS_RECENT, DashboardSql.SERVICE_METRICS_RECENT_PER_SERVICE);
  }

  public List<Map<String, Object>> anomaliesLastHour() {
    return cachedListOrQuery(DashboardCacheKeys.ANOMALIES, DashboardSql.ANOMALIES_LAST_HOUR);
  }

  public Map<String, Object> anomalyById(String id) {
    List<Map<String, Object>> rows = jdbcTemplate.queryForList(DashboardSql.ANOMALY_BY_ID, id);
    return rows.isEmpty() ? Map.of() : rows.get(0);
  }

  public List<Map<String, Object>> logsForAnomalyWindow(String id, int limit) {
    Map<String, Object> anomaly = anomalyById(id);
    if (anomaly.isEmpty()) {
      return List.of();
    }
    String serviceName = String.valueOf(anomaly.getOrDefault("service_name", ""));
    String windowStart = String.valueOf(anomaly.getOrDefault("window_start", ""));
    String windowEnd = String.valueOf(anomaly.getOrDefault("window_end", ""));
    if (serviceName.isBlank() || windowStart.isBlank() || windowEnd.isBlank()) {
      return List.of();
    }
    int safeLimit = Math.max(1, Math.min(500, limit));
    return jdbcTemplate.queryForList(
        DashboardSql.LOGS_HOT_BY_SERVICE_ENV_AND_WINDOW,
        serviceName,
        windowStart,
        windowEnd,
        safeLimit);
  }

  @SuppressWarnings("unchecked")
  private List<Map<String, Object>> cachedList(String key) {
    Object raw = redisTemplate.opsForValue().get(key);
    if (!(raw instanceof List<?> list)) {
      return List.of();
    }
    List<Map<String, Object>> out = new ArrayList<>(list.size());
    for (Object item : list) {
      if (item instanceof Map<?, ?> map) {
        out.add((Map<String, Object>) map);
      }
    }
    return out;
  }

  private List<Map<String, Object>> cachedListOrQuery(String cacheKey, String sql) {
    List<Map<String, Object>> cached = cachedList(cacheKey);
    if (!cached.isEmpty()) {
      return cached;
    }
    return jdbcTemplate.queryForList(sql);
  }
}
