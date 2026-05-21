/** JSON from Causr-log-processor `/topic/host-metrics` (Jackson camelCase). */
export type HostMetricsDto = {
  cpuUtilization: number | null
  /** True when CPU % was inferred from load ÷ logical cores (no utilization gauge). */
  cpuUtilizationFromLoad: boolean | null
  memoryUsageBytes: number | null
  memoryUtilization: number | null
  diskUtilization: number | null
  filesystemUtilization: number | null
  /** From cumulative system.disk.io (delta / s). */
  diskBytesPerSecond: number | null
  networkBytesPerSecond: number | null
  loadAverage1m: number | null
  /** Which window populated loadAverage1m: "1m" | "5m" | "15m". */
  loadAverageWindow: string | null
  pagingRate: number | null
  processCount: number | null
  timestamp: number
}

function optNum(o: Record<string, unknown>, k: string): number | null {
  const x = o[k]
  if (x === null || x === undefined) return null
  if (typeof x === 'number' && Number.isFinite(x)) return x
  return null
}

function optStr(o: Record<string, unknown>, k: string): string | null {
  const x = o[k]
  if (x === null || x === undefined) return null
  if (typeof x === 'string' && x.length > 0) return x
  return null
}

function optBool(o: Record<string, unknown>, k: string): boolean | null {
  const x = o[k]
  if (x === null || x === undefined) return null
  if (typeof x === 'boolean') return x
  return null
}

export function parseHostMetricsDto(raw: string): HostMetricsDto | null {
  try {
    const v = JSON.parse(raw) as unknown
    if (!v || typeof v !== 'object') return null
    const o = v as Record<string, unknown>
    const timestamp =
      typeof o.timestamp === 'number' && Number.isFinite(o.timestamp) ? o.timestamp : Date.now()
    return {
      cpuUtilization: optNum(o, 'cpuUtilization'),
      cpuUtilizationFromLoad: optBool(o, 'cpuUtilizationFromLoad'),
      memoryUsageBytes: optNum(o, 'memoryUsageBytes'),
      memoryUtilization: optNum(o, 'memoryUtilization'),
      diskUtilization: optNum(o, 'diskUtilization'),
      filesystemUtilization: optNum(o, 'filesystemUtilization'),
      diskBytesPerSecond: optNum(o, 'diskBytesPerSecond'),
      networkBytesPerSecond: optNum(o, 'networkBytesPerSecond'),
      loadAverage1m: optNum(o, 'loadAverage1m'),
      loadAverageWindow: optStr(o, 'loadAverageWindow'),
      pagingRate: optNum(o, 'pagingRate'),
      processCount: optNum(o, 'processCount'),
      timestamp,
    }
  } catch {
    return null
  }
}
