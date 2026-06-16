import { useCallback, useEffect, useState } from 'react';
import { fetchSummary } from '../api/bff';
import { DataTable } from '../components/DataTable';
import { ErrorBanner } from '../components/ErrorBanner';
import { KpiStrip } from '../components/KpiStrip';
import { StatusBadge } from '../components/StatusBadge';
import type { DashboardSummary, TopErrorRow } from '../types/dashboard';

const POLL_MS = 15_000;

function trendClass(trend?: string): string {
  if (trend === 'up') return 'trend-up';
  if (trend === 'down') return 'trend-down';
  return 'trend-flat';
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

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">Dashboard</h1>
        {summary?.generatedAt && (
          <span className="page-meta">{summary.generatedAt}</span>
        )}
      </div>

      {error && <ErrorBanner message={error} onRetry={() => void load()} />}

      {loading && !summary ? (
        <div className="kpi-strip">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="kpi-cell">
              <div className="skeleton" style={{ width: '60%', marginBottom: 4 }} />
              <div className="skeleton" style={{ width: '40%' }} />
            </div>
          ))}
        </div>
      ) : (
        <KpiStrip kpis={summary?.kpis} />
      )}

      <div className="panel">
        <div className="panel-head">Service health</div>
        <DataTable
          rows={summary?.serviceHealth ?? []}
          rowKey={(r) => String(r.service_name ?? Math.random())}
          emptyMessage="No service health data"
          columns={[
            { key: 'svc', header: 'Service', render: (r) => r.service_name ?? '—' },
            {
              key: 'err',
              header: 'Error %',
              className: 'mono',
              render: (r) =>
                r.error_percent != null ? Number(r.error_percent).toFixed(2) : '—',
            },
            {
              key: 'p99',
              header: 'P99 ms',
              className: 'mono',
              render: (r) => (r.p99_ms != null ? Number(r.p99_ms).toFixed(0) : '—'),
            },
            {
              key: 'rps',
              header: 'RPS',
              className: 'mono',
              render: (r) => (r.rps != null ? Number(r.rps).toFixed(2) : '—'),
            },
            {
              key: 'status',
              header: 'Status',
              render: (r) => <StatusBadge status={String(r.status ?? 'AMBER')} />,
            },
          ]}
        />
      </div>

      <div className="panel">
        <div className="panel-head">Top errors (30m)</div>
        <DataTable<TopErrorRow>
          rows={topErrors}
          rowKey={(r, i) => `${r.service_name}-${i}`}
          emptyMessage="No errors in window"
          columns={[
            { key: 'svc', header: 'Service', render: (r) => r.service_name ?? '—' },
            {
              key: 'msg',
              header: 'Message',
              className: 'truncate mono',
              render: (r) => r.message ?? '—',
            },
            {
              key: 'cnt',
              header: 'Count',
              className: 'mono',
              render: (r) => String(r.count ?? r.error_count ?? '—'),
            },
            {
              key: 'trend',
              header: 'Trend',
              render: (r) => (
                <span className={trendClass(r.trend)}>{r.trend ?? '—'}</span>
              ),
            },
          ]}
        />
      </div>
    </>
  );
}
