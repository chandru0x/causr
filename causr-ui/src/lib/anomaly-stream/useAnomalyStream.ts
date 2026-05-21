import { useEffect, useMemo, useState } from 'react'
import type { LogStreamStatus } from '../log-stream/useLogStream'
import { useLogStream, type AnomalyView } from '../log-stream/useLogStream'

const RELATIVE_TIME_TICK_MS = 30_000

export type { AnomalyView }

export type AnomalyCounts = {
  total: number
  critical: number
  warning: number
  services: number
}

export type SeverityFilter = 'all' | 'critical' | 'warning'

function computeCounts(anomalies: AnomalyView[]): AnomalyCounts {
  const services = new Set<string>()
  let critical = 0
  let warning = 0

  for (const a of anomalies) {
    services.add(a.service)
    const s = a.severity.toLowerCase()
    if (s === 'critical') critical += 1
    else if (s === 'warning') warning += 1
  }

  return {
    total: anomalies.length,
    critical,
    warning,
    services: services.size,
  }
}

/** Live anomalies from backend {@code /topic/anomalies} via shared WebSocket. */
export function useAnomalyStream(enabled = true, severityFilter: SeverityFilter = 'all') {
  const { anomalies, status, lastError } = useLogStream(enabled, {
    logs: false,
    metrics: false,
    fleet: false,
    host: false,
    anomalies: true,
  })

  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    if (!enabled) {
      return
    }
    const id = window.setInterval(() => setNow(Date.now()), RELATIVE_TIME_TICK_MS)
    return () => window.clearInterval(id)
  }, [enabled])

  const filtered = useMemo(() => {
    if (severityFilter === 'all') {
      return anomalies
    }
    return anomalies.filter((a) => a.severity.toLowerCase() === severityFilter)
  }, [anomalies, severityFilter])

  const counts = useMemo(() => computeCounts(anomalies), [anomalies])

  return {
    anomalies: filtered,
    allAnomalies: anomalies,
    counts,
    status: status as LogStreamStatus,
    lastError,
    now,
  }
}
