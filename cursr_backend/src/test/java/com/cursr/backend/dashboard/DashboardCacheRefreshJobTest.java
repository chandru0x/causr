package com.cursr.backend.dashboard;

import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.core.ValueOperations;
import org.springframework.messaging.simp.SimpMessagingTemplate;

@ExtendWith(MockitoExtension.class)
class DashboardCacheRefreshJobTest {

  @Mock
  private JdbcTemplate jdbcTemplate;

  @Mock
  private RedisTemplate<String, Object> redisTemplate;

  @Mock
  private ValueOperations<String, Object> valueOps;

  @Mock
  private DashboardSummaryService dashboardSummaryService;

  @Mock
  private SimpMessagingTemplate messagingTemplate;

  @BeforeEach
  void setUp() {
    when(redisTemplate.opsForValue()).thenReturn(valueOps);
  }

  @Test
  void refreshAll_writesAllDashboardKeys() {
    List<Map<String, Object>> row = List.of(Map.of("service_name", "svc"));
    Map<String, Object> summary = Map.of("generatedAt", "2026-01-01T00:00:00Z");
    when(jdbcTemplate.queryForList(anyString())).thenReturn(row);
    when(dashboardSummaryService.buildSummarySnapshot()).thenReturn(summary);

    DashboardCacheRefreshJob job = new DashboardCacheRefreshJob(
        jdbcTemplate,
        redisTemplate,
        dashboardSummaryService,
        messagingTemplate);
    job.refreshAll();

    verify(valueOps).set(eq(DashboardCacheKeys.ERROR_RATE), eq(row));
    verify(valueOps).set(eq(DashboardCacheKeys.LATENCY), eq(row));
    verify(valueOps).set(eq(DashboardCacheKeys.TOP_ERRORS), eq(row));
    verify(valueOps).set(eq(DashboardCacheKeys.RISK), eq(row));
    verify(valueOps).set(eq(DashboardCacheKeys.ERROR_CLUSTERS), eq(row));
    verify(valueOps).set(eq(DashboardCacheKeys.ANOMALIES), eq(row));
    verify(valueOps).set(eq(DashboardCacheKeys.SERVICE_METRICS_RECENT), eq(row));
    verify(valueOps).set(eq(DashboardCacheKeys.ERROR_RATE_GLOBAL), eq(row));
    verify(valueOps).set(eq(DashboardCacheKeys.P99_GLOBAL), eq(row));
    verify(valueOps).set(eq(DashboardCacheKeys.RPM_GLOBAL), eq(row));
    verify(valueOps).set(eq(DashboardCacheKeys.SERVICE_HEALTH_LOGS), eq(row));
    verify(valueOps).set(eq(DashboardCacheKeys.LAST_ANOMALY_TTD), eq(row));
    verify(valueOps).set(eq(DashboardCacheKeys.SUMMARY), eq(summary));
    verify(messagingTemplate).convertAndSend(eq("/topic/dashboard/summary"), eq(summary));
    verify(jdbcTemplate, times(12)).queryForList(anyString());
  }
}
