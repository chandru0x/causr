import { BFF_API_BASE } from '../config';
import type { DashboardSummary } from '../types/dashboard';

export async function fetchSummary(): Promise<DashboardSummary> {
  const res = await fetch(`${BFF_API_BASE}/api/dashboard/summary`);
  if (!res.ok) {
    throw new Error(`BFF summary failed: ${res.status} ${res.statusText}`);
  }
  return (await res.json()) as DashboardSummary;
}
