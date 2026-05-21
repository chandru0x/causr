import { NavLink } from 'react-router-dom'
import './ai-incident-intelligence.css'

export function AiIncidentIntelligenceTopBar() {
  return (
    <header className="ai-top">
      <div className="ai-top__logo" aria-hidden>
        AI
      </div>
      <div>
        <div className="ai-top__kicker">Causr</div>
        <div className="ai-top__title">AI Incident Intelligence</div>
      </div>
      <nav className="ai-top__nav" aria-label="Primary">
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
      <div className="ai-top__spacer" />
      <span className="ai-top__live">
        <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
          psychology
        </span>
        Models online
      </span>
    </header>
  )
}
