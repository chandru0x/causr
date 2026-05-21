import './ai-incident-intelligence.css'

const insights = [
  {
    label: 'Correlation',
    score: '0.91',
    title: 'DLQ depth tracks checkout validation timeouts',
    body: 'Cross-signal fusion suggests shared dependency saturation on policy-api replicas 3–5. Recommend targeted scale-out before broader rollback.',
  },
  {
    label: 'Blast radius',
    score: '0.78',
    title: 'Customer cohort · EU checkout',
    body: 'Impact concentrated in EU region during peak. US traffic within SLO. Suggest geo-fenced mitigation and comms scoped to EU storefronts.',
  },
  {
    label: 'Remediation',
    score: '0.86',
    title: 'Suggested playbook ordering',
    body: '1) Drain DLQ with rate limit 2) Bump policy-api HPA max 3) Hold canary 10m and re-evaluate error budget burn.',
  },
]

export function AiIncidentIntelligenceFeed() {
  return (
    <div className="ai-feed">
      <section className="ai-hero" aria-label="Live intelligence">
        <div className="ai-hero__row">
          <div>
            <div className="ai-card__label" style={{ marginBottom: 6 }}>
              Live incident graph
            </div>
            <h2 className="ai-hero__title">Unified reasoning across logs, metrics, and traces</h2>
          </div>
          <span className="ai-card__score" style={{ borderColor: 'rgba(178,178,255,0.35)', color: 'var(--lun-info-fg)' }}>
            Confidence 0.88
          </span>
        </div>
        <p className="ai-hero__sub">
          Causr AI continuously scores hypotheses against your fleet topology, SLO state, and change
          events. Cards below are explainable and cite the underlying signals used in each inference step.
        </p>
      </section>

      {insights.map((card) => (
        <article key={card.title} className="ai-card">
          <div className="ai-card__head">
            <span className="ai-card__label">{card.label}</span>
            <span className="ai-card__score">{card.score} match</span>
          </div>
          <h3>{card.title}</h3>
          <p>{card.body}</p>
        </article>
      ))}
    </div>
  )
}
