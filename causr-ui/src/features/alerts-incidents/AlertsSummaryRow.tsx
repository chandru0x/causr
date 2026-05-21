import type { AnomalyCounts } from '../../lib/anomaly-stream/useAnomalyStream'
import './alerts-incidents.css'

type AlertsSummaryRowProps = {
  counts: AnomalyCounts
}

export function AlertsSummaryRow({ counts }: AlertsSummaryRowProps) {
  return (
    <div className="alerts-summary" aria-label="Alert summary">
      <div className="alerts-summary__card">
        <span className="alerts-summary__label">Firing</span>
        <span className="alerts-summary__value">{counts.total}</span>
      </div>
      <div className="alerts-summary__card alerts-summary__card--crit">
        <span className="alerts-summary__label">Critical</span>
        <span className="alerts-summary__value">{counts.critical}</span>
      </div>
      <div className="alerts-summary__card alerts-summary__card--warn">
        <span className="alerts-summary__label">Warning</span>
        <span className="alerts-summary__value">{counts.warning}</span>
      </div>
      <div className="alerts-summary__card">
        <span className="alerts-summary__label">Services</span>
        <span className="alerts-summary__value">{counts.services}</span>
      </div>
    </div>
  )
}
