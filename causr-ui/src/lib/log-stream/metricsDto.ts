/** JSON from Causr-log-processor `/topic/metrics` (fleet aggregate, Jackson camelCase). */
export type MetricsDto = {
  /** Present for fleet messages: {@code "fleet"}. */
  service?: string
  /** Lines (logs) per second in the last window; mirrors {@code totalRequests} for fleet. */
  rps: number
  ingestRate: number
  errorRate: number
  totalRequests: number
  errorCount: number
  /** Error lines in the last ~1s (fleet delta); chart Errors tab. */
  errorsPerSecond: number
  p99Latency: number
  activeIncidents: number
  timestamp: number
}

export type ChartPoint = {
  t: number
  rps: number
  errorCount: number
  errorsPerSecond: number
  errorRate: number
}

export function parseMetricsDto(raw: string): MetricsDto | null {
  try {
    const v = JSON.parse(raw) as unknown
    if (!v || typeof v !== 'object') return null
    const o = v as Record<string, unknown>
    const num = (k: string, d = 0) => {
      const x = o[k]
      return typeof x === 'number' && Number.isFinite(x) ? x : d
    }
    const service = typeof o.service === 'string' ? o.service : undefined
    const totalRequests = Math.trunc(num('totalRequests', 0))
    const ingestRate = num('ingestRate', totalRequests)
    const rps = num('rps', ingestRate || totalRequests)
    const errorRate = num('errorRate', 0)
    const errorCount = Math.trunc(num('errorCount', 0))
    const errorsPerSecond = Math.trunc(num('errorsPerSecond', 0))
    const p99Latency = num('p99Latency', 0)
    const activeIncidents = Math.trunc(num('activeIncidents', 0))
    const timestamp =
      typeof o.timestamp === 'number' && Number.isFinite(o.timestamp) ? o.timestamp : Date.now()
    return {
      service,
      rps,
      ingestRate,
      errorRate,
      totalRequests,
      errorCount,
      errorsPerSecond,
      p99Latency,
      activeIncidents,
      timestamp,
    }
  } catch {
    return null
  }
}

export function metricsDtoToChartPoint(dto: MetricsDto): ChartPoint {
  const rps = dto.rps || dto.ingestRate || 0
  const errorsPerSecond = dto.errorsPerSecond ?? 0
  return {
    t: dto.timestamp,
    rps,
    errorCount: dto.errorCount,
    errorsPerSecond,
    errorRate: dto.errorRate,
  }
}
