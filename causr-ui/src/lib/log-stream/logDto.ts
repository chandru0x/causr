/** Matches {@code LogDto} JSON from Causr-log-processor {@code /topic/logs}. */
export type LogDto = {
  serviceName: string
  level: string
  message: string
  timestampEpochMillis: number
}

export function parseLogDto(raw: string): LogDto | null {
  try {
    const v = JSON.parse(raw) as unknown
    if (!v || typeof v !== 'object') return null
    const o = v as Record<string, unknown>
    const serviceName = typeof o.serviceName === 'string' ? o.serviceName : 'unknown'
    const level = typeof o.level === 'string' ? o.level : 'INFO'
    const message = typeof o.message === 'string' ? o.message : ''
    const ts = o.timestampEpochMillis
    const timestampEpochMillis =
      typeof ts === 'number' && Number.isFinite(ts) ? ts : Date.now()
    return { serviceName, level, message, timestampEpochMillis }
  } catch {
    return null
  }
}
