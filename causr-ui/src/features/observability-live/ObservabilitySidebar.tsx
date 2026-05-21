import { useState } from 'react'
import type { ReactNode } from 'react'
import './ObservabilitySidebar.css'

type ObservabilitySidebarProps = {
  children: ReactNode
  /** When false, hides the left icon rail (dashboard-only trim). */
  showRail?: boolean
}

const railItems = [
  { id: 'overview', icon: 'dashboard', label: 'Overview' },
  { id: 'logs', icon: 'terminal', label: 'Logs' },
  { id: 'metrics', icon: 'monitoring', label: 'Metrics' },
  { id: 'traces', icon: 'timeline', label: 'Traces' },
  { id: 'infra', icon: 'layers', label: 'Infrastructure' },
  { id: 'settings', icon: 'tune', label: 'Settings' },
] as const

export function ObservabilitySidebar({
  children,
  showRail = true,
}: ObservabilitySidebarProps) {
  const [active, setActive] = useState<string>('overview')

  return (
    <div className={`obs-layout${showRail ? '' : ' obs-layout--noRail'}`}>
      {showRail && (
        <aside className="obs-rail" aria-label="Workspace">
          {railItems.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`obs-rail__btn${active === item.id ? ' active' : ''}`}
              title={item.label}
              aria-label={item.label}
              aria-pressed={active === item.id}
              onClick={() => setActive(item.id)}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 22 }}>
                {item.icon}
              </span>
            </button>
          ))}
          <div className="obs-rail__spacer" />
          <div className="obs-rail__footer">
            <button type="button" className="obs-rail__btn" title="Help" aria-label="Help">
              <span className="material-symbols-outlined" style={{ fontSize: 22 }}>
                help
              </span>
            </button>
          </div>
        </aside>
      )}
      <div className="obs-body">{children}</div>
    </div>
  )
}
