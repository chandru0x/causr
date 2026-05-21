/** Matches {@code AnomalyDto} JSON from Causr-log-processor {@code /topic/anomalies}. */
export type AnomalyDto = {
  service: string
  type: string
  severity: string
  message: string
  timestamp: number
}

export function parseAnomalyDto(raw: string): AnomalyDto | null {
  try {
    const v = JSON.parse(raw) as unknown
    if (!v || typeof v !== 'object') return null
    const o = v as Record<string, unknown>
    const service = typeof o.service === 'string' ? o.service : 'unknown'
    const type = typeof o.type === 'string' ? o.type : 'UNKNOWN'
    const severity = typeof o.severity === 'string' ? o.severity : 'warning'
    const message = typeof o.message === 'string' ? o.message : ''
    const ts = o.timestamp
    const timestamp = typeof ts === 'number' && Number.isFinite(ts) ? ts : Date.now()
    return { service, type, severity, message, timestamp }
  } catch {
    return null
  }
}

export function anomalyId(dto: AnomalyDto): string {
  return `${dto.timestamp}-${dto.service}-${dto.type}`
}
