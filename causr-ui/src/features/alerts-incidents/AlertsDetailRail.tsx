import {
  anomalyTypeLabel,
  severityBadgeVariant,
  severityLabel,
} from '../../lib/anomaly-stream/anomalyLabels'
import { formatRelativeTime, formatTimestamp } from '../../lib/anomaly-stream/formatRelativeTime'
import type { AnomalyView } from '../../lib/anomaly-stream/useAnomalyStream'
import './alerts-incidents.css'

type AlertsDetailRailProps = {
  selected: AnomalyView | null
  serviceTimeline: AnomalyView[]
  now: number
}

export function AlertsDetailRail({ selected, serviceTimeline, now }: AlertsDetailRailProps) {
  if (!selected) {
    return (
      <aside className="alerts-rail" aria-label="Alert details">
        <div className="alerts-rail__empty">
          <span className="material-symbols-outlined" aria-hidden>
            touch_app
          </span>
          <p>Select an alert to view details</p>
        </div>
      </aside>
    )
  }

  const variant = severityBadgeVariant(selected.severity)
  const isCritical = selected.severity.toLowerCase() === 'critical'

  return (
    <aside className="alerts-rail" aria-label="Alert details">
      <div className="alerts-rail__head">
        <span className={`alerts-badge alerts-badge--${variant}`}>
          {severityLabel(selected.severity)}
        </span>
        <span className="alerts-rail__time">{formatRelativeTime(selected.timestamp, now)}</span>
      </div>

      <h2 className="alerts-rail__title">{anomalyTypeLabel(selected.type)}</h2>
      <p className="alerts-rail__service">{selected.service}</p>

      <div className="alerts-rail__block">
        <h3 className="alerts-rail__label">Message</h3>
        <p className="alerts-rail__message">{selected.message}</p>
      </div>

      <div className="alerts-rail__meta">
        <div>
          <span className="alerts-rail__meta-key">Type</span>
          <span className="alerts-rail__meta-val">{selected.type}</span>
        </div>
        <div>
          <span className="alerts-rail__meta-key">Detected</span>
          <span className="alerts-rail__meta-val">{formatTimestamp(selected.timestamp)}</span>
        </div>
      </div>

      {isCritical && (
        <div className="alerts-rail__escalation">
          <span className="material-symbols-outlined" aria-hidden>
            emergency
          </span>
          <div>
            <strong>PagerDuty escalation</strong>
            <span>Critical anomalies trigger on-call via PagerDuty Events API.</span>
          </div>
        </div>
      )}

      {serviceTimeline.length > 0 && (
        <div className="alerts-rail__block">
          <h3 className="alerts-rail__label">Service timeline</h3>
          <ul className="alerts-rail__timeline">
            {serviceTimeline.map((a) => (
              <li key={a.id} className="alerts-rail__tl-item">
                <span className="alerts-rail__tl-time">{formatRelativeTime(a.timestamp, now)}</span>
                <div className="alerts-rail__tl-card">
                  <strong>{anomalyTypeLabel(a.type)}</strong>
                  <span>{a.message}</span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </aside>
  )
}
