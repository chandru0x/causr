import { PROCESSOR_API_BASE } from '../config';
import type { LogRow } from '../types/dashboard';

export async function fetchRecentLogs(): Promise<LogRow[]> {
  const res = await fetch(`${PROCESSOR_API_BASE}/api/logs/recent`);
  if (!res.ok) {
    throw new Error(`Processor logs failed: ${res.status} ${res.statusText}`);
  }
  return (await res.json()) as LogRow[];
}
