package com.cursr.backend.dashboard;

import java.util.List;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.annotation.Profile;
import org.springframework.context.event.EventListener;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
@Profile("!test")
public class DashboardCacheRefreshJob {

  private static final Logger log = LoggerFactory.getLogger(DashboardCacheRefreshJob.class);

  private final JdbcTemplate jdbcTemplate;
  private final RedisTemplate<String, Object> redisTemplate;
  private final DashboardSummaryService dashboardSummaryService;
  private final SimpMessagingTemplate messagingTemplate;

  public DashboardCacheRefreshJob(
      JdbcTemplate jdbcTemplate,
      RedisTemplate<String, Object> redisTemplate,
      DashboardSummaryService dashboardSummaryService,
      SimpMessagingTemplate messagingTemplate) {
    this.jdbcTemplate = jdbcTemplate;
    this.redisTemplate = redisTemplate;
    this.dashboardSummaryService = dashboardSummaryService;
    this.messagingTemplate = messagingTemplate;
  }

  @EventListener(ApplicationReadyEvent.class)
  public void warmOnStartup() {
    refreshAll();
  }

  @Scheduled(fixedRate = 10_000)
  public void updateDashboardCache() {
    refreshAll();
  }

  void refreshAll() {
    boolean useSpans = preferSpanMetrics();
    putIfOk(
        DashboardCacheKeys.ERROR_RATE,
        () ->
            jdbcTemplate.queryForList(
                useSpans ? DashboardSql.ERROR_RATE_LAST_5_MIN_SPANS : DashboardSql.ERROR_RATE_LAST_5_MIN));
    putIfOk(
        DashboardCacheKeys.LATENCY,
        () ->
            jdbcTemplate.queryForList(
                useSpans ? DashboardSql.P95_LATENCY_LAST_5_MIN_SPANS : DashboardSql.P95_LATENCY_LAST_5_MIN));
    putIfOk(DashboardCacheKeys.TOP_ERRORS, () -> jdbcTemplate.queryForList(DashboardSql.TOP_ERRORS_30M_WITH_TREND));
    putIfOk(DashboardCacheKeys.RISK, () -> jdbcTemplate.queryForList(DashboardSql.FAILURE_RISK_LAST_10_MIN));
    putIfOk(DashboardCacheKeys.ERROR_CLUSTERS, () -> jdbcTemplate.queryForList(DashboardSql.TOP_ERROR_CLUSTERS));
    putIfOk(DashboardCacheKeys.ANOMALIES, () -> jdbcTemplate.queryForList(DashboardSql.ANOMALIES_LAST_HOUR));
    putIfOk(
        DashboardCacheKeys.SERVICE_METRICS_RECENT,
        () -> jdbcTemplate.queryForList(DashboardSql.SERVICE_METRICS_RECENT_PER_SERVICE));
    putIfOk(
        DashboardCacheKeys.ERROR_RATE_GLOBAL,
        () ->
            jdbcTemplate.queryForList(
                useSpans
                    ? DashboardSql.ERROR_RATE_GLOBAL_TWO_WINDOWS_SPANS
                    : DashboardSql.ERROR_RATE_GLOBAL_TWO_WINDOWS));
    putIfOk(
        DashboardCacheKeys.P99_GLOBAL,
        () ->
            jdbcTemplate.queryForList(
                useSpans ? DashboardSql.P99_GLOBAL_TWO_WINDOWS_SPANS : DashboardSql.P99_GLOBAL_TWO_WINDOWS));
    putIfOk(
        DashboardCacheKeys.RPM_GLOBAL,
        () ->
            jdbcTemplate.queryForList(
                useSpans ? DashboardSql.RPM_GLOBAL_TWO_WINDOWS_SPANS : DashboardSql.RPM_GLOBAL_TWO_WINDOWS));
    putIfOk(
        DashboardCacheKeys.SERVICE_HEALTH_LOGS,
        () ->
            jdbcTemplate.queryForList(
                useSpans ? DashboardSql.SERVICE_HEALTH_FROM_SPANS_5M : DashboardSql.SERVICE_HEALTH_FROM_LOGS_5M));
    putIfOk(
        DashboardCacheKeys.LAST_ANOMALY_TTD,
        () -> jdbcTemplate.queryForList(DashboardSql.TIME_TO_DETECT_LAST_INCIDENT));
    putSummary();
  }

  /**
   * When recent SERVER spans exist, KPIs and service health use {@code observability.spans}; otherwise
   * {@code logs_hot} (log-based latency attributes or zeros).
   */
  private boolean preferSpanMetrics() {
    try {
      Long c = jdbcTemplate.queryForObject(DashboardSql.SPANS_SERVER_RECENT_COUNT, Long.class);
      return c != null && c > 0;
    } catch (Exception e) {
      return false;
    }
  }

  private void putIfOk(String key, java.util.concurrent.Callable<List<Map<String, Object>>> query) {
    try {
      List<Map<String, Object>> rows = query.call();
      redisTemplate.opsForValue().set(key, rows);
    } catch (Exception e) {
      log.warn("Dashboard cache refresh skipped for key {}: {}", key, e.getMessage());
    }
  }

  private void putSummary() {
    try {
      Map<String, Object> summary = dashboardSummaryService.buildSummarySnapshot();
      redisTemplate.opsForValue().set(DashboardCacheKeys.SUMMARY, summary);
      messagingTemplate.convertAndSend("/topic/dashboard/summary", summary);
    } catch (Exception e) {
      log.warn("Dashboard cache refresh skipped for key {}: {}", DashboardCacheKeys.SUMMARY, e.getMessage());
    }
  }
}
