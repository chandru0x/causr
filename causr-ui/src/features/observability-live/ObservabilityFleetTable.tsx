import type { FleetServicesDto } from '../../lib/log-stream/fleetServicesDto'
import type { HostMetricsDto } from '../../lib/log-stream/hostMetricsDto'
import './ObservabilityFleetTable.css'

const emDash = '—'

/** Shown when OTLP has no `service.namespace` (or equivalent) on fleet rows yet. */
const DEFAULT_NAMESPACE = 'default'

/** Shown when no deploy version is attached to fleet rows yet. */
const DEFAULT_VERSION = 'unknown'

function formatCompactRps(n: number): string {
  if (!Number.isFinite(n) || n < 0) return emDash
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`
  if (n >= 1) return `${n.toFixed(1)}`
  return n > 0 ? `${n.toFixed(2)}` : '0'
}

function formatP99(ms: number): string {
  if (!Number.isFinite(ms) || ms < 0) return emDash
  if (ms <= 0) return '0ms'
  return `${Math.round(ms)}ms`
}

/** Per-row CPU if present; otherwise same host CPU % as ObservabilityInfraLayer (rounded). */
function formatFleetCpu(
  rowCpu: number | null | undefined,
  hostCpu: number | null | undefined,
): string {
  let v: number | null = null
  if (rowCpu != null && Number.isFinite(rowCpu)) {
    v = rowCpu
  } else if (hostCpu != null && Number.isFinite(hostCpu)) {
    v = hostCpu
  }
  if (v == null) return emDash
  return `${Math.round(v)}%`
}

function formatNamespace(s: string | null | undefined): string {
  if (s == null || s.length === 0) return DEFAULT_NAMESPACE
  return s
}

function formatVersion(s: string | null | undefined): string {
  if (s == null || s.length === 0) return DEFAULT_VERSION
  return s
}

export type ObservabilityFleetTableProps = {
  fleet: FleetServicesDto | null
  streamLive: boolean
  /** Host/node CPU from `/topic/host-metrics`; shown in each row when row has no per-service CPU. */
  hostMetrics: HostMetricsDto | null
}

export function ObservabilityFleetTable({ fleet, streamLive, hostMetrics }: ObservabilityFleetTableProps) {
  const rows = fleet?.services ?? []
  const titleSuffix = rows.length > 0 ? ` (${rows.length})` : ''

  return (
    <section className="obs-fleet" aria-label="Service fleet">
      <div className="obs-fleet__head">
        <h2 className="obs-fleet__title">Service fleet{titleSuffix}</h2>
        <p className="obs-fleet__meta">
          {streamLive
            ? '/topic/fleet-services · RPS = lines/s per service · CPU = host /topic/host-metrics when unset per row'
            : 'Connect live stream to load fleet rows'}
        </p>
      </div>
      <div className="obs-fleet__wrap">
        <table>
          <thead>
            <tr>
              <th>Service</th>
              <th>Namespace</th>
              <th>Version</th>
              <th>RPS</th>
              <th>P99</th>
              <th>CPU</th>
              <th>Health</th>
            </tr>
          </thead>
          <tbody>
            {!streamLive && rows.length === 0 ? (
              <tr>
                <td colSpan={7} className="obs-fleet__empty">
                  Offline — fleet table fills when the log WebSocket is live.
                </td>
              </tr>
            ) : streamLive && rows.length === 0 ? (
              <tr>
                <td colSpan={7} className="obs-fleet__empty">
                  No services in the registry yet — ingest logs from logs.raw to populate rows.
                </td>
              </tr>
            ) : (
              rows.map((r) => (
                <tr key={r.serviceName}>
                  <td>{r.serviceName}</td>
                  <td>{formatNamespace(r.namespace)}</td>
                  <td>{formatVersion(r.version)}</td>
                  <td>{formatCompactRps(r.rps)}</td>
                  <td>{formatP99(r.p99Latency)}</td>
                  <td>{formatFleetCpu(r.cpuUtilization, hostMetrics?.cpuUtilization)}</td>
                  <td>
                    <span
                      className={`obs-fleet__pill${r.healthy ? ' obs-fleet__pill--ok' : ' obs-fleet__pill--degraded'}`}
                    >
                      <span className="obs-fleet__pill-dot" aria-hidden />
                      {r.healthy ? 'Healthy' : 'Degraded'}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  )
}
