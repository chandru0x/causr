import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Activity, AlertCircle, Radar, RefreshCw } from 'lucide-react';
import { fetchSummary } from '@/api/bff';
import { AnomalyScoreBadge } from '@/components/anomaly-score-badge';
import { EmptyState } from '@/components/empty-state';
import { KpiCards } from '@/components/kpi-cards';
import { PageHeader } from '@/components/page-header';
import { SectionCard } from '@/components/section-card';
import { StatusBadge } from '@/components/status-badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { AnomalyRow, DashboardSummary, TopErrorRow } from '@/types/dashboard';
import { formatWindowRange } from '@/utils/anomaly';
import { hasTelemetryData } from '@/utils/dashboard';
import { cn } from '@/lib/utils';

const POLL_MS = 15_000;

function trendClass(trend?: string): string {
  if (trend === 'up') return 'text-emerald-600 dark:text-emerald-400';
  if (trend === 'down') return 'text-destructive';
  return 'text-muted-foreground';
}

export function DashboardPage() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const data = await fetchSummary();
      setSummary(data);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load summary');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
    const t = setInterval(() => void load(), POLL_MS);
    return () => clearInterval(t);
  }, [load]);

  const topErrors = (summary?.topErrors ?? []).slice(0, 10);
  const recentAnomalies = [...(summary?.anomalies ?? [])]
    .sort((a, b) => Number(a.anomaly_score ?? 0) - Number(b.anomaly_score ?? 0))
    .slice(0, 5);
  const serviceHealth = summary?.serviceHealth ?? [];
  const hasData = hasTelemetryData(summary?.kpis, serviceHealth);

  return (
    <>
      <PageHeader
        title="Dashboard"
        description="Service health, errors, and recent anomalies."
        actions={
          <>
            {summary?.generatedAt && (
              <span className="text-xs text-muted-foreground">{summary.generatedAt}</span>
            )}
            <Button variant="outline" size="sm" onClick={() => void load()}>
              <RefreshCw className="size-4" />
              Refresh
            </Button>
          </>
        }
      />

      {error && (
        <Alert variant="destructive" className="mb-5">
          <AlertTitle>Failed to load</AlertTitle>
          <AlertDescription className="flex items-center justify-between gap-4">
            <span>{error}</span>
            <Button variant="outline" size="sm" onClick={() => void load()}>
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      )}

      <KpiCards
        kpis={summary?.kpis}
        loading={loading && !summary}
        hasTelemetryData={hasData}
      />

      <div className="mt-7 grid gap-5">
        <SectionCard title="Service health" accent="teal" viewAllHref="/services">
          {serviceHealth.length === 0 ? (
            <EmptyState
              icon={Activity}
              title="No service health data"
              description="Start sending traces via OTLP to see service health."
              action={
                <Button variant="outline" size="sm" asChild>
                  <Link to="/services">View services</Link>
                </Button>
              }
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Service</TableHead>
                  <TableHead className="text-right">Error %</TableHead>
                  <TableHead className="text-right">P99 ms</TableHead>
                  <TableHead className="text-right">RPS</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {serviceHealth.map((r) => (
                  <TableRow key={String(r.service_name)}>
                    <TableCell className="font-medium">{r.service_name ?? '—'}</TableCell>
                    <TableCell className="text-right font-mono text-sm">
                      {r.error_percent != null ? Number(r.error_percent).toFixed(2) : '—'}
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm">
                      {r.p99_ms != null ? Number(r.p99_ms).toFixed(0) : '—'}
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm">
                      {r.rps != null ? Number(r.rps).toFixed(2) : '—'}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={String(r.status ?? 'AMBER')} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </SectionCard>

        <SectionCard title="Top errors (30m)" accent="red" viewAllHref="/logs">
          {topErrors.length === 0 ? (
            <EmptyState
              icon={AlertCircle}
              title="No errors in window"
              description="That's good—or no ERROR logs have arrived yet."
              action={
                <Button variant="outline" size="sm" asChild>
                  <Link to="/logs">View logs</Link>
                </Button>
              }
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Service</TableHead>
                  <TableHead>Message</TableHead>
                  <TableHead className="text-right">Count</TableHead>
                  <TableHead>Trend</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topErrors.map((r: TopErrorRow, i) => (
                  <TableRow key={`${r.service_name}-${i}`}>
                    <TableCell>{r.service_name ?? '—'}</TableCell>
                    <TableCell className="max-w-xs truncate font-mono text-xs">
                      {r.message ?? '—'}
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm">
                      {String(r.count ?? r.error_count ?? '—')}
                    </TableCell>
                    <TableCell>
                      <span className={cn('text-sm', trendClass(r.trend))}>{r.trend ?? '—'}</span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </SectionCard>

        <SectionCard title="Recent anomalies (1h)" accent="amber" viewAllHref="/anomalies">
          {recentAnomalies.length === 0 ? (
            <EmptyState
              icon={Radar}
              title="No anomalies in the last hour"
              description="Run the processor in dev mode or emit a test anomaly."
              action={
                <Button variant="outline" size="sm" asChild>
                  <Link to="/anomalies">View anomalies</Link>
                </Button>
              }
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Service</TableHead>
                  <TableHead>Env</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead>Window</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentAnomalies.map((r: AnomalyRow, i) => (
                  <TableRow key={String(r.id ?? i)}>
                    <TableCell className="font-medium">{r.service_name ?? '—'}</TableCell>
                    <TableCell>{r.environment ?? '—'}</TableCell>
                    <TableCell>
                      <AnomalyScoreBadge score={Number(r.anomaly_score)} />
                    </TableCell>
                    <TableCell className="max-w-xs truncate font-mono text-xs">
                      {formatWindowRange(r.window_start, r.window_end)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </SectionCard>
      </div>
    </>
  );
}
