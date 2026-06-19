import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import type { DashboardKpis, KpiValue } from '@/types/dashboard';
import {
  errorRateAccentClass,
  servicesHealthyAccentClass,
} from '@/utils/dashboard';
import { cn } from '@/lib/utils';

interface KpiCardsProps {
  kpis?: DashboardKpis;
  loading?: boolean;
  hasTelemetryData?: boolean;
}

function formatKpi(value: KpiValue | undefined, type: 'percent' | 'number' | 'latency' | 'ratio') {
  if (!value) {
    return '—';
  }
  if (type === 'percent' && value.currentPercent != null) {
    return `${value.currentPercent.toFixed(2)}%`;
  }
  if (type === 'latency' && value.value != null) {
    return `${value.value.toFixed(0)} ms`;
  }
  if (type === 'ratio' && value.healthy != null && value.total != null) {
    return `${value.healthy}/${value.total}`;
  }
  if (value.value != null) {
    return value.value.toFixed(2);
  }
  if (value.current != null) {
    return String(value.current);
  }
  return '—';
}

function deltaClass(direction?: string): string {
  if (direction === 'up') return 'text-emerald-600 dark:text-emerald-400';
  if (direction === 'down') return 'text-destructive';
  return 'text-muted-foreground';
}

function kpiAccentClass(
  key: (typeof KPI_CONFIG)[number]['key'],
  kpi: KpiValue | undefined,
  hasData: boolean,
): string | undefined {
  if (!hasData) {
    return undefined;
  }
  if (key === 'errorRate') {
    return errorRateAccentClass(kpi);
  }
  if (key === 'servicesHealthy') {
    return servicesHealthyAccentClass(kpi);
  }
  return undefined;
}

const KPI_CONFIG = [
  { key: 'errorRate' as const, title: 'Error rate', type: 'percent' as const },
  { key: 'p99LatencyMs' as const, title: 'P99 latency', type: 'latency' as const },
  { key: 'requestsPerMinute' as const, title: 'Requests/min', type: 'number' as const },
  { key: 'servicesHealthy' as const, title: 'Services healthy', type: 'ratio' as const },
  { key: 'timeToDetect' as const, title: 'Time to detect', type: 'latency' as const },
];

export function KpiCards({ kpis, loading, hasTelemetryData: hasData = true }: KpiCardsProps) {
  if (loading) {
    return (
      <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-5">
        {KPI_CONFIG.map((k) => (
          <Card key={k.key}>
            <CardHeader className="pb-1.5">
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const waiting = !hasData;

  return (
    <div className="space-y-3">
      <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-5">
        {KPI_CONFIG.map(({ key, title, type }) => {
          const kpi = kpis?.[key];
          const accent = kpiAccentClass(key, kpi, hasData);
          return (
            <Card key={key} className={cn(accent && 'border-l-4', accent)}>
              <CardHeader className="pb-1.5">
                <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
              </CardHeader>
              <CardContent>
                {waiting ? (
                  <div className="space-y-2">
                    <Skeleton className="h-8 w-20" />
                    <p className="text-xs text-muted-foreground">Waiting for data…</p>
                  </div>
                ) : (
                  <>
                    <p className="text-2xl font-semibold tabular-nums">{formatKpi(kpi, type)}</p>
                    {kpi?.direction && (
                      <p className={cn('mt-1 text-xs', deltaClass(kpi.direction))}>
                        {kpi.direction} vs prior window
                      </p>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
      {waiting && (
        <p className="text-xs text-muted-foreground">
          Connect a service via OTLP to populate metrics.
        </p>
      )}
    </div>
  );
}
