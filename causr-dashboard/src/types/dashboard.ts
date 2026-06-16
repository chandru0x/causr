export type JsonRecord = Record<string, unknown>;

export interface KpiValue {
  currentPercent?: number;
  previousPercent?: number;
  value?: number;
  previousValue?: number;
  window?: string;
  compareWindow?: string;
  direction?: string;
  health?: string;
  current?: number;
  previous?: number;
  healthy?: number;
  total?: number;
  severity?: string;
  seconds?: number;
}

export interface DashboardKpis {
  errorRate?: KpiValue;
  p99LatencyMs?: KpiValue;
  requestsPerMinute?: KpiValue;
  servicesHealthy?: KpiValue;
  timeToDetect?: KpiValue;
}

export interface ServiceHealthRow {
  service_name?: string;
  error_percent?: number;
  p99_ms?: number;
  rps?: number;
  status?: string;
}

export interface TopErrorRow {
  service_name?: string;
  message?: string;
  count?: number;
  error_count?: number;
  trend?: string;
}

export interface AnomalyRow {
  id?: string;
  window_start?: string;
  window_end?: string;
  service_name?: string;
  environment?: string;
  anomaly_score?: number;
  rca_text?: string;
  is_anomaly?: number;
}

export interface DashboardSummary {
  summaryVersion?: number;
  generatedAt?: string;
  kpis?: DashboardKpis;
  serviceHealth?: ServiceHealthRow[];
  topErrors?: TopErrorRow[];
  anomalies?: AnomalyRow[];
}

export interface LogRow {
  timestamp?: string;
  service_name?: string;
  log_level?: string;
  message?: string;
  cluster_id?: string;
  anomaly_score?: number;
}
