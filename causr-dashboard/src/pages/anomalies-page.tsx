import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, RefreshCw } from 'lucide-react';
import { fetchAnomalyDetail, fetchAnomalyLogs, fetchSummary } from '@/api/bff';
import { fetchServices } from '@/api/services';
import { AnomalyDetailPanel } from '@/components/anomaly-detail-panel';
import { AnomalyScoreBadge } from '@/components/anomaly-score-badge';
import { PageHeader } from '@/components/page-header';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import type { AnomalyRow, LogRow } from '@/types/dashboard';
import type { ServiceRow } from '@/types/services';
import { formatWindowRange } from '@/utils/anomaly';
import { cn } from '@/lib/utils';

const POLL_MS = 15_000;

export function AnomaliesPage() {
  const [rows, setRows] = useState<AnomalyRow[]>([]);
  const [services, setServices] = useState<ServiceRow[]>([]);
  const [openId, setOpenId] = useState<string | null>(null);
  const [detail, setDetail] = useState<AnomalyRow | null>(null);
  const [logs, setLogs] = useState<LogRow[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const [summary, serviceRows] = await Promise.all([fetchSummary(), fetchServices()]);
      setRows(summary.anomalies ?? []);
      setServices(serviceRows);
      setLastUpdated(summary.generatedAt ?? new Date().toISOString());
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load anomalies');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
    const t = setInterval(() => void load(), POLL_MS);
    return () => clearInterval(t);
  }, [load]);

  const serviceByName = useMemo(() => {
    const map = new Map<string, ServiceRow>();
    for (const service of services) {
      map.set(service.serviceName, service);
    }
    return map;
  }, [services]);

  const sorted = useMemo(() => {
    return [...rows].sort((a, b) => Number(a.anomaly_score ?? 0) - Number(b.anomaly_score ?? 0));
  }, [rows]);

  const toggleRow = async (id: string) => {
    if (openId === id) {
      setOpenId(null);
      setDetail(null);
      setLogs([]);
      return;
    }
    setOpenId(id);
    setDetailLoading(true);
    setDetail(null);
    setLogs([]);
    try {
      const [row, windowLogs] = await Promise.all([fetchAnomalyDetail(id), fetchAnomalyLogs(id)]);
      setDetail(row);
      setLogs(windowLogs);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load anomaly detail');
      setOpenId(null);
    } finally {
      setDetailLoading(false);
    }
  };

  return (
    <>
      <PageHeader
        title="Anomalies"
        description="AI-detected service windows (last hour). Lower score = more anomalous."
        actions={
          <>
            {lastUpdated && (
              <span className="text-xs text-muted-foreground">updated {lastUpdated}</span>
            )}
            <span className="text-xs text-muted-foreground">{sorted.length} in last hour</span>
            <Button variant="outline" size="sm" onClick={() => void load()}>
              <RefreshCw className="size-4" />
              Refresh
            </Button>
          </>
        }
      />

      {error && (
        <Alert variant="destructive" className="mb-5">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription className="flex items-center justify-between gap-4">
            <span>{error}</span>
            <Button variant="outline" size="sm" onClick={() => void load()}>
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {loading && sorted.length === 0 ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : sorted.length === 0 ? (
        <Card>
          <CardContent className="space-y-2.5 py-7 text-center">
            <p className="text-sm text-muted-foreground">No anomalies in the last hour.</p>
            <p className="text-xs text-muted-foreground">
              Ensure <code className="rounded bg-muted px-1">log-processor-service</code> runs with{' '}
              <code className="rounded bg-muted px-1">SPRING_PROFILES_ACTIVE=dev</code> and{' '}
              <code className="rounded bg-muted px-1">ai-service</code> is up.
            </p>
            <pre className="mx-auto max-w-lg overflow-x-auto rounded-lg border bg-muted/50 p-3 text-left font-mono text-xs">
              curl -X POST
              &apos;http://localhost:8080/api/dev/emit-anomaly?serviceName=payment-service&amp;environment=staging&apos;
            </pre>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {sorted.map((r, i) => {
            const id = String(r.id ?? i);
            const isOpen = openId === id;
            return (
              <Card key={id} className={cn(isOpen && 'ring-1 ring-ring')}>
                <button
                  type="button"
                  className="flex w-full items-start justify-between gap-3.5 p-3.5 text-left"
                  onClick={() => void toggleRow(id)}
                  aria-expanded={isOpen}
                >
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium">{r.service_name ?? '—'}</span>
                      <span className="rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                        {r.environment ?? '—'}
                      </span>
                    </div>
                    <p className="font-mono text-xs text-muted-foreground">
                      {formatWindowRange(r.window_start, r.window_end)}
                      {r.created_at ? ` · detected ${r.created_at}` : ''}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <AnomalyScoreBadge score={Number(r.anomaly_score)} />
                    <ChevronDown
                      className={cn('size-4 text-muted-foreground transition-transform', isOpen && 'rotate-180')}
                    />
                  </div>
                </button>
                {isOpen && (
                  <AnomalyDetailPanel
                    row={detail ?? r}
                    logs={logs}
                    loading={detailLoading}
                    service={serviceByName.get(String(r.service_name ?? ''))}
                  />
                )}
              </Card>
            );
          })}
        </div>
      )}

      <p className="mt-6 text-sm text-muted-foreground">
        <Link to="/" className="underline underline-offset-4 hover:text-foreground">
          Back to dashboard
        </Link>
      </p>
    </>
  );
}
