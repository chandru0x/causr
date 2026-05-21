import { useCallback, useEffect, useMemo, useState } from 'react'
import { useAnomalyStream, type SeverityFilter } from '../../lib/anomaly-stream/useAnomalyStream'
import { AlertsDetailRail } from './AlertsDetailRail'
import { AlertsFeed } from './AlertsFeed'
import { AlertsIncidentsTopBar } from './AlertsIncidentsTopBar'
import { AlertsSummaryRow } from './AlertsSummaryRow'
import './alerts-incidents.css'

export function AlertsIncidentsPage() {
  const [severityFilter, setSeverityFilter] = useState<SeverityFilter>('all')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [acknowledged, setAcknowledged] = useState<Set<string>>(() => new Set())

  const { anomalies, allAnomalies, counts, status, lastError, now } = useAnomalyStream(
    true,
    severityFilter,
  )

  useEffect(() => {
    if (anomalies.length === 0) {
      return
    }
    const stillVisible = anomalies.some((a) => a.id === selectedId)
    if (!selectedId || !stillVisible) {
      setSelectedId(anomalies[0].id)
    }
  }, [anomalies, selectedId])

  const selected = useMemo(
    () => allAnomalies.find((a) => a.id === selectedId) ?? null,
    [allAnomalies, selectedId],
  )

  const serviceTimeline = useMemo(() => {
    if (!selected) {
      return []
    }
    return allAnomalies
      .filter((a) => a.service === selected.service && a.id !== selected.id)
      .slice(0, 8)
  }, [allAnomalies, selected])

  const handleAcknowledge = useCallback((id: string) => {
    setAcknowledged((prev) => {
      const next = new Set(prev)
      next.add(id)
      return next
    })
  }, [])

  return (
    <div className="alerts-page">
      <AlertsIncidentsTopBar
        counts={counts}
        status={status}
        severityFilter={severityFilter}
        onSeverityFilterChange={setSeverityFilter}
      />
      <AlertsSummaryRow counts={counts} />
      <div className="alerts-main">
        <AlertsFeed
          anomalies={anomalies}
          selectedId={selectedId}
          acknowledged={acknowledged}
          status={status}
          lastError={lastError}
          now={now}
          onSelect={setSelectedId}
          onAcknowledge={handleAcknowledge}
        />
        <AlertsDetailRail
          selected={selected}
          serviceTimeline={serviceTimeline}
          now={now}
        />
      </div>
    </div>
  )
}
