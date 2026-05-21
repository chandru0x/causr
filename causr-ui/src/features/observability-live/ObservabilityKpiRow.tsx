import { useEffect, useRef, useState } from 'react'
import type { MetricsDto } from '../../lib/log-stream/metricsDto'
import './ObservabilityKpiRow.css'

type KpiTone = 'up' | 'down' | 'neutral'

type KpiCard = {
  label: string
  value: string
  meta: string
  tone: KpiTone
}

function formatIngestPerMin(linesPerSec: number): string {
  const perMin = linesPerSec * 60
  if (perMin >= 1_000_000) {
    return `${(perMin / 1_000_000).toFixed(2)}M / min`
  }
  if (perMin >= 10_000) {
    return `${(perMin / 1000).toFixed(1)}k / min`
  }
  if (perMin >= 1000) {
    return `${(perMin / 1000).toFixed(2)}k / min`
  }
  return `${Math.round(perMin)} / min`
}

function buildKpis(m: MetricsDto | null, prevP99: number | null): KpiCard[] {
  const linesPerSec = m ? m.rps || m.ingestRate || 0 : 0
  const errPct = m?.errorRate ?? 0
  const budget = Math.max(0, Math.min(100, 100 - errPct))
  const p99 = m?.p99Latency ?? 0
  const incidents = m?.activeIncidents ?? 0

  const p99Delta =
    prevP99 !== null && m ? Math.round(p99 - prevP99) : null
  const p99Meta =
    p99Delta === null
      ? 'P99 on ≤1000 samples · 5m rolling'
      : p99Delta === 0
        ? 'flat vs last tick'
        : `${p99Delta > 0 ? '+' : ''}${p99Delta} ms vs last`

  const ingestMeta = m
    ? `Rolling total ${m.totalRequests.toLocaleString()} lines · last 1s ${Math.round(linesPerSec)} lines/s`
    : 'Waiting for /topic/metrics'

  const budgetMeta =
    errPct < 1
      ? 'SLO healthy · rolling totals'
      : errPct < 5
        ? 'Watch · rolling totals'
        : errPct < 15
          ? 'Elevated · rolling totals'
          : 'Burn risk · rolling totals'

  const incidentMeta =
    incidents === 0 ? 'No FATAL counters' : `${incidents} in incident counter`

  return [
    {
      label: 'Ingest rate',
      value: m ? formatIngestPerMin(linesPerSec) : '—',
      meta: ingestMeta,
      tone: 'neutral',
    },
    {
      label: 'Error budget',
      value: m ? `${budget.toFixed(1)}%` : '—',
      meta: budgetMeta,
      tone: errPct < 5 ? 'up' : errPct < 15 ? 'neutral' : 'down',
    },
    {
      label: 'P99 latency',
      value: m ? `${Math.round(p99)} ms` : '—',
      meta: p99Meta,
      tone: p99Delta === null || p99Delta === 0 ? 'neutral' : p99Delta < 0 ? 'up' : 'down',
    },
    {
      label: 'Active incidents',
      value: m ? String(incidents) : '—',
      meta: incidentMeta,
      tone: incidents === 0 ? 'up' : incidents < 3 ? 'neutral' : 'down',
    },
  ]
}

export type ObservabilityKpiRowProps = {
  /** Latest fleet {@code MetricsDto} from {@code /topic/metrics}. */
  fleet: MetricsDto | null
  /** True when STOMP session is live (may still have no metrics yet). */
  streamLive: boolean
}

export function ObservabilityKpiRow({ fleet, streamLive }: ObservabilityKpiRowProps) {
  const prevP99Ref = useRef<number | null>(null)
  const [kpis, setKpis] = useState<KpiCard[]>(() => buildKpis(null, null))

  useEffect(() => {
    setKpis(buildKpis(fleet, prevP99Ref.current))
    if (fleet) {
      prevP99Ref.current = fleet.p99Latency
    }
  }, [fleet])

  if (!streamLive && !fleet) {
    return (
      <section className="obs-kpi" aria-label="Key metrics">
        <article className="obs-kpi__card obs-kpi__card--muted">
          <div className="obs-kpi__label">Metrics</div>
          <div className="obs-kpi__value">Offline</div>
          <div className="obs-kpi__meta obs-kpi__meta--neutral">Connect to log processor for live KPIs</div>
        </article>
      </section>
    )
  }

  return (
    <section className="obs-kpi" aria-label="Key metrics">
      {kpis.map((k) => (
        <article key={k.label} className="obs-kpi__card">
          <div className="obs-kpi__label">{k.label}</div>
          <div className="obs-kpi__value">{k.value}</div>
          <div
            className={`obs-kpi__meta obs-kpi__meta--${k.tone === 'neutral' ? 'neutral' : k.tone === 'up' ? 'up' : 'down'}`}
          >
            {k.meta}
          </div>
        </article>
      ))}
    </section>
  )
}
