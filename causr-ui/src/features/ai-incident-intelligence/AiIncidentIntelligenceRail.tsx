import './ai-incident-intelligence.css'

export function AiIncidentIntelligenceRail() {
  return (
    <aside className="ai-rail" aria-label="Pipeline and queue">
      <div className="ai-rail__block">
        <h3>Incident summary</h3>
        <p>
          <strong style={{ color: 'var(--lun-foreground)' }}>INC-2041</strong> — Checkout partial outage.
          Primary hypothesis: downstream policy validation latency. Secondary: DLQ consumer lag.
        </p>
      </div>
      <div className="ai-rail__block">
        <h3>Signal pipeline</h3>
        <ul className="ai-rail__list">
          <li>Ingest · 842k lines/min normalized</li>
          <li>Feature store · 128 dims / service</li>
          <li>Graph · topology + deploy edges</li>
          <li>LLM · structured JSON output only</li>
        </ul>
      </div>
      <div className="ai-rail__block">
        <h3>Scoring</h3>
        <p>Bayesian stack + calibrated abstention. Human override required for customer-facing comms drafts.</p>
      </div>
      <div className="ai-rail__block" style={{ flex: 1 }}>
        <h3>Remediation queue</h3>
        <div className="ai-queue-item">
          <span>Scale policy-api</span>
          <span style={{ color: 'var(--lun-primary)' }}>ready</span>
        </div>
        <div className="ai-queue-item">
          <span>Drain DLQ · rate cap</span>
          <span style={{ color: 'var(--lun-muted-fg)' }}>pending</span>
        </div>
        <div className="ai-queue-item">
          <span>Postmortem scaffold</span>
          <span style={{ color: 'var(--lun-muted-fg)' }}>queued</span>
        </div>
      </div>
    </aside>
  )
}
