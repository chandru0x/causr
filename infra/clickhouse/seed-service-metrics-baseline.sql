-- Dev/local: backfill 7 days of baseline service_metrics so the AI history gate passes
-- and the IsolationForest has enough rows (>= 20) to train on real-shaped data.
--
-- Run:
--   clickhouse-client --host localhost --multiquery < infra/clickhouse/seed-service-metrics-baseline.sql
-- Or via HTTP:
--   curl -s 'http://localhost:8123/' --data-binary @infra/clickhouse/seed-service-metrics-baseline.sql

INSERT INTO observability.service_metrics (
  window_start,
  window_end,
  tenant_id,
  service_name,
  environment,
  log_volume,
  error_volume,
  error_rate,
  p99_latency_ms,
  unique_error_types,
  new_error_types,
  silence_flag,
  deployment_flag,
  time_of_day_sin,
  time_of_day_cos,
  ai_anomaly_score
)
SELECT
  window_start,
  window_start + INTERVAL 30 SECOND AS window_end,
  '' AS tenant_id,
  s.service_name,
  s.environment,
  800 + (slot % 12) * 15 AS log_volume,
  30 + (slot % 8) AS error_volume,
  0.04 + (slot % 5) * 0.002 AS error_rate,
  80.0 + (slot % 10) * 12 AS p99_latency_ms,
  2 + (slot % 4) AS unique_error_types,
  0 AS new_error_types,
  0 AS silence_flag,
  0 AS deployment_flag,
  sin(2 * pi() * toHour(window_start) / 24) AS time_of_day_sin,
  cos(2 * pi() * toHour(window_start) / 24) AS time_of_day_cos,
  0.0 AS ai_anomaly_score
FROM
(
  SELECT DISTINCT
    service_name,
    if(
      attributes['deployment.environment'] = '',
      'prod',
      attributes['deployment.environment']
    ) AS environment
  FROM observability.logs_hot
  WHERE timestamp > now() - INTERVAL 7 DAY
    AND service_name != ''
) AS s
CROSS JOIN
(
  SELECT
    toDateTime(now() - INTERVAL day_offset DAY - INTERVAL slot * 1800 SECOND) AS window_start,
    slot
  FROM
  (
    SELECT number AS day_offset FROM numbers(7)
  ) AS days
  CROSS JOIN
  (
    SELECT number AS slot FROM numbers(48)
  ) AS slots
) AS windows;
