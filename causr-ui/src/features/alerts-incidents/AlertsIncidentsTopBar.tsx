import { NavLink } from 'react-router-dom'
import type { AnomalyCounts, SeverityFilter } from '../../lib/anomaly-stream/useAnomalyStream'
import type { LogStreamStatus } from '../../lib/log-stream/useLogStream'
import './alerts-incidents.css'

type AlertsIncidentsTopBarProps = {
  counts: AnomalyCounts
  status: LogStreamStatus
  severityFilter: SeverityFilter
  onSeverityFilterChange: (filter: SeverityFilter) => void
}

export function AlertsIncidentsTopBar({
  counts,
  status,
  severityFilter,
  onSeverityFilterChange,
}: AlertsIncidentsTopBarProps) {
  const streamLive = status === 'live'

  return (
    <header className="alerts-top">
      <div className="alerts-top__brand">
        <div className="alerts-top__logo" aria-hidden>
          C
        </div>
        <div className="alerts-top__titles">
          <div className="alerts-top__product">Causr</div>
          <div className="alerts-top__screen">Alerts &amp; Incidents</div>
        </div>
        <nav className="alerts-top__nav" aria-label="Primary">
          <NavLink className={({ isActive }) => (isActive ? 'active' : '')} to="/observability">
            Live
          </NavLink>
          <NavLink className={({ isActive }) => (isActive ? 'active' : '')} to="/alerts">
            Alerts
          </NavLink>
          <NavLink className={({ isActive }) => (isActive ? 'active' : '')} to="/ai-intelligence">
            AI
          </NavLink>
        </nav>
      </div>

      <div className="alerts-top__filters" role="group" aria-label="Severity filter">
        {(['all', 'critical', 'warning'] as const).map((f) => (
          <button
            key={f}
            type="button"
            className={`alerts-top__filter${severityFilter === f ? ' alerts-top__filter--active' : ''}`}
            onClick={() => onSeverityFilterChange(f)}
          >
            {f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      <div className="alerts-top__spacer" />

      <span className="alerts-top__chip" role="status" aria-live="polite">
        {counts.total} firing
      </span>
      <span className="alerts-top__chip alerts-top__chip--crit">
        {counts.critical} critical
      </span>

      <span
        className={`alerts-top__live${streamLive ? ' alerts-top__live--on' : ''}`}
        title={streamLive ? 'Anomaly stream connected' : 'Connecting…'}
        role="status"
      >
        <span className="alerts-top__live-dot" />
        {streamLive ? 'Live' : status === 'connecting' ? 'Connecting' : 'Offline'}
      </span>
    </header>
  )
}
