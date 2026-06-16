import { useCallback, useEffect, useMemo, useState } from 'react';
import { fetchSummary } from '../api/bff';
import { ErrorBanner } from '../components/ErrorBanner';
import type { AnomalyRow } from '../types/dashboard';

const POLL_MS = 30_000;

export function AnomaliesPage() {
  const [rows, setRows] = useState<AnomalyRow[]>([]);
  const [openId, setOpenId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const summary = await fetchSummary();
      setRows(summary.anomalies ?? []);
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

  const sorted = useMemo(() => {
    return [...rows].sort((a, b) => {
      const as = Number(a.anomaly_score ?? 0);
      const bs = Number(b.anomaly_score ?? 0);
      return as - bs;
    });
  }, [rows]);

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">Anomalies</h1>
        <button type="button" className="btn-refresh" onClick={() => void load()}>
          Refresh
        </button>
      </div>

      <p className="hint">Lower score = more anomalous. Click a row for RCA.</p>

      {error && <ErrorBanner message={error} onRetry={() => void load()} />}

      {loading && sorted.length === 0 ? (
        <div className="hint">Loading…</div>
      ) : sorted.length === 0 ? (
        <div className="hint">No anomalies in the last hour</div>
      ) : (
        <ul className="anomaly-list">
          {sorted.map((r, i) => {
            const id = String(r.id ?? i);
            const isOpen = openId === id;
            return (
              <li
                key={id}
                className="anomaly-item"
                onClick={() => setOpenId(isOpen ? null : id)}
              >
                <div className="anomaly-item-head">
                  <span>{r.service_name ?? '—'}</span>
                  <span className="mono" style={{ color: 'var(--muted)' }}>
                    score {r.anomaly_score ?? '—'}
                  </span>
                </div>
                <div className="anomaly-item-meta">
                  {r.window_start ?? '—'} · env {r.environment ?? '—'}
                </div>
                {isOpen && (
                  <pre className="anomaly-rca">{r.rca_text ?? '(no RCA yet)'}</pre>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
