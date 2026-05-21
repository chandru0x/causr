/** JSON from Causr-log-processor `/topic/fleet-services` (~1 Hz, Jackson camelCase). */

export type ServiceFleetRowDto = {
  serviceName: string
  namespace: string | null
  version: string | null
  rps: number
  p99Latency: number
  errorRate: number
  cpuUtilization: number | null
  healthy: boolean
  activeIncidents: number
}

export type FleetServicesDto = {
  timestamp: number
  services: ServiceFleetRowDto[]
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

function parseServiceRow(o: Record<string, unknown>): ServiceFleetRowDto | null {
  const serviceName = optStr(o, 'serviceName')
  if (!serviceName) return null
  const rps = optNum(o, 'rps') ?? 0
  const p99Latency = optNum(o, 'p99Latency') ?? 0
  const errorRate = optNum(o, 'errorRate') ?? 0
  const cpuUtilization = optNum(o, 'cpuUtilization')
  const activeIncidents = Math.trunc(optNum(o, 'activeIncidents') ?? 0)
  const healthy = typeof o.healthy === 'boolean' ? o.healthy : false
  return {
    serviceName,
    namespace: optStr(o, 'namespace'),
    version: optStr(o, 'version'),
    rps,
    p99Latency,
    errorRate,
    cpuUtilization,
    healthy,
    activeIncidents,
  }
}

export function parseFleetServicesDto(raw: string): FleetServicesDto | null {
  try {
    const v = JSON.parse(raw) as unknown
    if (!v || typeof v !== 'object') return null
    const o = v as Record<string, unknown>
    const timestamp =
      typeof o.timestamp === 'number' && Number.isFinite(o.timestamp) ? o.timestamp : Date.now()
    const rawList = o.services
    const services: ServiceFleetRowDto[] = []
    if (Array.isArray(rawList)) {
      for (const item of rawList) {
        if (item && typeof item === 'object') {
          const row = parseServiceRow(item as Record<string, unknown>)
          if (row) services.push(row)
        }
      }
    }
    return { timestamp, services }
  } catch {
    return null
  }
}
