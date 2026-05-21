import { NavLink } from 'react-router-dom'
import './ObservabilityTopBar.css'

export function ObservabilityTopBar() {
  return (
    <header className="obs-top">
      <div className="obs-top__brand">
        <div className="obs-top__logo" aria-hidden>
          C
        </div>
        <div className="obs-top__titles">
          <div className="obs-top__product">Causr Observability</div>
          <div className="obs-top__screen">Live · Fleet &amp; streams</div>
        </div>
        <nav className="obs-top__nav" aria-label="Primary">
          <NavLink className={({ isActive }) => (isActive ? 'active' : '')} to="/observability" end>
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

      <div className="obs-top__search">
        <label className="obs-top__search-inner">
          <span className="material-symbols-outlined" aria-hidden>
            search
          </span>
          <input type="search" placeholder="Search services, traces, IDs…" />
        </label>
      </div>

      <div className="obs-top__actions">
        <button type="button" className="obs-top__icon-btn" aria-label="Notifications">
          <span className="material-symbols-outlined" style={{ fontSize: 20 }}>
            notifications
          </span>
        </button>
        <span className="obs-top__pill">
          Env <strong>prod-eu-1</strong>
        </span>
        <span className="obs-top__pill">
          Range <strong>Last 1h</strong>
        </span>
        <span className="obs-top__live" title="Ingest connected">
          <span className="obs-top__live-dot" />
          Live
        </span>
        <div className="obs-top__avatar" aria-hidden>
          JD
        </div>
      </div>
    </header>
  )
}
