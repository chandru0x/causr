import {
  anomalyTypeLabel,
  severityBadgeVariant,
  severityLabel,
} from '../../lib/anomaly-stream/anomalyLabels'
import { formatRelativeTime } from '../../lib/anomaly-stream/formatRelativeTime'
import type { AnomalyView } from '../../lib/anomaly-stream/useAnomalyStream'
import type { LogStreamStatus } from '../../lib/log-stream/useLogStream'
import './alerts-incidents.css'

type AlertsFeedProps = {
  anomalies: AnomalyView[]
  selectedId: string | null
  acknowledged: Set<string>
  status: LogStreamStatus
  lastError: string | null
  now: number
  onSelect: (id: string) => void
  onAcknowledge: (id: string) => void
}

export function AlertsFeed({
  anomalies,
  selectedId,
  acknowledged,
  status,
  lastError,
  now,
  onSelect,
  onAcknowledge,
}: AlertsFeedProps) {
  return (
    <section className="alerts-feed" aria-label="Anomaly feed">
      <div className="alerts-feed__head">
        <h2 className="alerts-feed__title">Firing alerts</h2>
        <span className="alerts-feed__count" role="status" aria-live="polite">
          {anomalies.length} shown
        </span>
      </div>

      <div className="alerts-feed__body">
        {status === 'error' && (
          <div className="alerts-empty alerts-empty--error" role="alert">
            <span className="material-symbols-outlined" aria-hidden>
              error
            </span>
            <p>{lastError ?? 'WebSocket unavailable'}</p>
          </div>
        )}

        {status === 'connecting' && (
          <div className="alerts-empty">
            <span className="alerts-empty__spinner" aria-hidden />
            <p>Connecting to anomaly stream…</p>
          </div>
        )}

        {status === 'live' && anomalies.length === 0 && (
          <div className="alerts-empty">
            <span className="material-symbols-outlined" aria-hidden>
              notifications
            </span>
            <p>No anomalies yet</p>
            <span className="alerts-empty__hint">Listening on /topic/anomalies</span>
          </div>
        )}

        <ul className="alerts-feed__list">
          {anomalies.map((a) => {
            const variant = severityBadgeVariant(a.severity)
            const isSelected = a.id === selectedId
            const isAcked = acknowledged.has(a.id)

            return (
              <li key={a.id}>
                <article
                  className={`alerts-card alerts-card--${variant}${isSelected ? ' alerts-card--selected' : ''}${isAcked ? ' alerts-card--acked' : ''}`}
                  onClick={() => onSelect(a.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      onSelect(a.id)
                    }
                  }}
                  role="button"
                  tabIndex={0}
                  aria-pressed={isSelected}
                >
                  <div className={`alerts-card__stripe alerts-card__stripe--${variant}`} aria-hidden />
                  <div className="alerts-card__main">
                    <div className="alerts-card__row">
                      <span className={`alerts-badge alerts-badge--${variant}`}>
                        {severityLabel(a.severity)}
                      </span>
                      <span className="alerts-card__time">
                        {formatRelativeTime(a.timestamp, now)}
                      </span>
                    </div>
                    <h3 className="alerts-card__type">{anomalyTypeLabel(a.type)}</h3>
                    <p className="alerts-card__service">{a.service}</p>
                    <p className="alerts-card__message">{a.message}</p>
                  </div>
                  <button
                    type="button"
                    className="alerts-card__ack"
                    aria-label="Acknowledge alert"
                    onClick={(e) => {
                      e.stopPropagation()
                      onAcknowledge(a.id)
                    }}
                  >
                    <span className="material-symbols-outlined" aria-hidden>
                      check
                    </span>
                  </button>
                </article>
              </li>
            )
          })}
        </ul>
      </div>
    </section>
  )
}
