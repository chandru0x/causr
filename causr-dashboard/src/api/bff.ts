import { BFF_API_BASE } from '../config';
import type { AnomalyRow, DashboardSummary, LogRow } from '../types/dashboard';

async function bffGet<T>(path: string): Promise<T> {
  const res = await fetch(`${BFF_API_BASE}${path}`);
  if (!res.ok) {
    throw new Error(`BFF request failed: ${res.status} ${res.statusText}`);
  }
  return (await res.json()) as T;
}

export async function fetchSummary(): Promise<DashboardSummary> {
  return bffGet<DashboardSummary>('/api/dashboard/summary');
}

export async function fetchAnomalyDetail(id: string): Promise<AnomalyRow> {
  return bffGet<AnomalyRow>(`/api/dashboard/anomalies/${encodeURIComponent(id)}`);
}

export async function fetchAnomalyLogs(id: string, limit = 50): Promise<LogRow[]> {
  return bffGet<LogRow[]>(
    `/api/dashboard/anomalies/${encodeURIComponent(id)}/logs?limit=${limit}`,
  );
}
