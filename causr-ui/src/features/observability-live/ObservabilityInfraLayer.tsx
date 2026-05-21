import { useMemo } from 'react'
import type { HostMetricsDto } from '../../lib/log-stream/hostMetricsDto'
import './ObservabilityInfraLayer.css'

type InfraMetricAccent = 'cpu' | 'mem' | 'disk' | 'fs' | 'net' | 'load' | 'paging' | 'proc'

type InfraMetric = {
  id: string
  label: string
  value: string
  hint?: string
  accent: InfraMetricAccent
  usagePct?: number
}

const emDash = '—'

function formatPct(n: number | null | undefined, digits = 0): string {
  if (n == null || !Number.isFinite(n)) return emDash
  return `${n.toFixed(digits)}%`
}

function formatMemoryGb(bytes: number | null | undefined): string {
  if (bytes == null || !Number.isFinite(bytes)) return emDash
  const gb = bytes / (1024 * 1024 * 1024)
  return `${gb.toFixed(1)} GB`
}

function formatThroughput(bytesPerSec: number | null | undefined): string {
  if (bytesPerSec == null || !Number.isFinite(bytesPerSec)) return emDash
  const mb = bytesPerSec / (1024 * 1024)
  if (mb >= 0.1) return `${mb.toFixed(1)} MB/s`
  if (mb > 0) return `${mb.toFixed(2)} MB/s`
  const kb = bytesPerSec / 1024
  return `${kb.toFixed(0)} KB/s`
}

function formatLoad(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n)) return emDash
  return n.toFixed(2)
}

function formatPaging(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n)) return emDash
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k/s`
  return `${n.toFixed(1)}/s`
}

function formatProcessCount(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n)) return emDash
  return String(Math.round(n))
}

function formatMemoryPrimary(h: HostMetricsDto | null): string {
  if (h?.memoryUtilization != null) return formatPct(h.memoryUtilization, 1)
  if (h?.memoryUsageBytes != null) return formatMemoryGb(h.memoryUsageBytes)
  return emDash
}

function buildHostMetricCards(h: HostMetricsDto | null): InfraMetric[] {
  const memHint =
    h?.memoryUtilization != null && h?.memoryUsageBytes != null
      ? `${formatMemoryGb(h.memoryUsageBytes)} used`
      : 'system.memory.utilization (preferred) or system.memory.usage'

  const diskHasIo = h?.diskBytesPerSecond != null && Number.isFinite(h.diskBytesPerSecond)
  const diskValue = diskHasIo
    ? formatThroughput(h.diskBytesPerSecond)
    : formatPct(h?.diskUtilization, 0)
  const diskHint = diskHasIo
    ? h?.diskUtilization != null
      ? `system.disk.io · mount util ${formatPct(h.diskUtilization, 0)}`
      : 'system.disk.io (rate after 2nd sample)'
    : 'system.disk.io or mount utilization %'

  return [
    {
      id: 'cpu',
      label: 'CPU usage',
      value: formatPct(h?.cpuUtilization, 0),
      hint:
        h?.cpuUtilizationFromLoad === true
          ? 'Estimated from load average ÷ logical CPU count (no system.cpu.utilization in batch)'
          : 'system.cpu.utilization (mean of points, 0–1 → %); container.cpu.utilization if absent',
      accent: 'cpu',
      usagePct: h?.cpuUtilization != null ? Math.min(100, Math.max(0, h.cpuUtilization)) : undefined,
    },
    {
      id: 'mem',
      label: 'Memory usage',
      value: formatMemoryPrimary(h),
      hint: memHint,
      accent: 'mem',
      usagePct:
        h?.memoryUtilization != null
          ? Math.min(100, Math.max(0, h.memoryUtilization))
          : undefined,
    },
    {
      id: 'disk',
      label: diskHasIo ? 'Disk I/O' : 'Disk usage',
      value: diskValue,
      hint: diskHint,
      accent: 'disk',
      usagePct:
        !diskHasIo && h?.diskUtilization != null
          ? Math.min(100, Math.max(0, h.diskUtilization))
          : undefined,
    },
    {
      id: 'fs',
      label: 'Filesystem',
      value: formatPct(h?.filesystemUtilization, 0),
      hint: 'system.filesystem.* or container.filesystem.*; mountpoint + used/free',
      accent: 'fs',
      usagePct:
        h?.filesystemUtilization != null
          ? Math.min(100, Math.max(0, h.filesystemUtilization))
          : undefined,
    },
    {
      id: 'net',
      label: 'Network throughput',
      value: formatThroughput(h?.networkBytesPerSecond),
      hint: 'system.network.io (rate after 2nd sample)',
      accent: 'net',
    },
    {
      id: 'load',
      label: 'Load average',
      value: formatLoad(h?.loadAverage1m),
      hint: h?.loadAverageWindow
        ? `${h.loadAverageWindow} · system.cpu.load_average.* (analysis)`
        : 'system.cpu.load_average.* (analysis)',
      accent: 'load',
    },
    {
      id: 'paging',
      label: 'Paging',
      value: formatPaging(h?.pagingRate),
      hint: 'system.paging.faults (rate after 2nd sample)',
      accent: 'paging',
    },
    {
      id: 'proc',
      label: 'Process count',
      value: formatProcessCount(h?.processCount),
      hint: 'system.processes.count or system.process.count',
      accent: 'proc',
    },
  ]
}

export type ObservabilityInfraLayerProps = {
  hostMetrics: HostMetricsDto | null
  streamLive: boolean
}

export function ObservabilityInfraLayer({ hostMetrics, streamLive }: ObservabilityInfraLayerProps) {
  const cards = useMemo(() => buildHostMetricCards(hostMetrics), [hostMetrics])

  return (
    <section className="obs-infra" aria-label="Infrastructure layer and host metrics">
      <div className="obs-infra__head">
        <h2 className="obs-infra__title">Infrastructure layer</h2>
        <div className="obs-infra__tags">
          <span className="obs-infra__tag">Region eu-west-1</span>
          <span className="obs-infra__tag">Mesh v2</span>
        </div>
      </div>

      {streamLive && !hostMetrics ? (
        <p className="obs-infra__note">Waiting for /topic/host-metrics…</p>
      ) : null}
      {!streamLive ? (
        <p className="obs-infra__note obs-infra__note--muted">Connect to log processor for live host metrics</p>
      ) : null}

      <div className="obs-infra__metrics" role="list">
        {cards.map((m) => (
          <article
            key={m.id}
            className={`obs-infra__metric obs-infra__metric--${m.accent}`}
            role="listitem"
            aria-label={`${m.label}: ${m.value}`}
          >
            <div className="obs-infra__metric-label">{m.label}</div>
            <div className="obs-infra__metric-value">{m.value}</div>
            {m.hint ? <div className="obs-infra__metric-hint">{m.hint}</div> : null}
            {m.usagePct !== undefined ? (
              <div className="obs-infra__metric-track" aria-hidden>
                <div className="obs-infra__metric-fill" style={{ width: `${m.usagePct}%` }} />
              </div>
            ) : null}
          </article>
        ))}
      </div>
    </section>
  )
}
