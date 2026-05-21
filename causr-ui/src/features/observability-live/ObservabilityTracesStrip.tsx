import type { CSSProperties } from 'react'
import './ObservabilityTracesStrip.css'

const seg = (w: string): CSSProperties => ({ ['--w' as string]: w })

export function ObservabilityTracesStrip() {
  return (
    <section className="obs-traces" aria-label="Trace waterfall preview">
      <div className="obs-traces__head">
        <h2 className="obs-traces__title">Distributed traces</h2>
        <div className="obs-traces__bar" aria-hidden>
          <div className="obs-traces__seg" style={seg('72%')} />
          <div className="obs-traces__seg" style={seg('45%')} />
          <div className="obs-traces__seg" style={seg('88%')} />
          <div className="obs-traces__seg" style={seg('30%')} />
          <div className="obs-traces__seg" style={seg('55%')} />
        </div>
      </div>
      <div className="obs-traces__meta">
        <span>
          Root <strong>checkout.validate</strong>
        </span>
        <span>
          Trace <strong>8f3a9c…21</strong>
        </span>
        <span>
          Spans <strong>42</strong>
        </span>
        <span>
          Duration <strong>214 ms</strong>
        </span>
      </div>
    </section>
  )
}
