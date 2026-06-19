import type { DashboardKpis, KpiValue, ServiceHealthRow } from '@/types/dashboard';

export function hasTelemetryData(
  kpis?: DashboardKpis,
  serviceHealth?: ServiceHealthRow[],
): boolean {
  if ((serviceHealth?.length ?? 0) > 0) {
    return true;
  }
  if ((kpis?.servicesHealthy?.total ?? 0) > 0) {
    return true;
  }
  if ((kpis?.requestsPerMinute?.current ?? 0) > 0) {
    return true;
  }
  return false;
}

export function errorRateAccentClass(kpi: KpiValue | undefined): string | undefined {
  const pct = kpi?.currentPercent;
  if (pct == null) {
    return undefined;
  }
  if (pct <= 1) {
    return 'border-l-emerald-500';
  }
  if (pct <= 5) {
    return 'border-l-amber-500';
  }
  return 'border-l-red-500';
}

export function servicesHealthyAccentClass(kpi: KpiValue | undefined): string | undefined {
  switch (kpi?.severity) {
    case 'green':
      return 'border-l-emerald-500';
    case 'amber':
      return 'border-l-amber-500';
    case 'red':
      return 'border-l-red-500';
    default:
      return undefined;
  }
}
