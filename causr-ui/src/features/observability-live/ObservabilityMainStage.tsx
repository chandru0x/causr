import { useId, useMemo, useRef, useState } from 'react'
import {
  buildThroughputSeriesPaths,
  chartDimensions,
  chartIndexFromSvgX,
  type ThroughputTab,
} from '../../lib/log-stream/throughputChartPaths'
import type { ChartPoint } from '../../lib/log-stream/metricsDto'
import type { LogLineView, LogStreamStatus } from '../../lib/log-stream/useLogStream'
import './ObservabilityMainStage.css'

function formatChartTooltipTime(ms: number): string {
  const d = new Date(ms)
  return d.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  })
}

function svgPointFromClient(svg: SVGSVGElement, clientX: number, clientY: number) {
  const pt = svg.createSVGPoint()
  pt.x = clientX
  pt.y = clientY
  const ctm = svg.getScreenCTM()
  if (!ctm) {
    return null
  }
  return pt.matrixTransform(ctm.inverse())
}

export type ObservabilityMainStageProps = {
  lines: LogLineView[]
  chartPoints: ChartPoint[]
  status: LogStreamStatus
  lastError: string | null
}

export function ObservabilityMainStage({
  lines,
  chartPoints,
  status,
  lastError,
}: ObservabilityMainStageProps) {
  const [tab, setTab] = useState<ThroughputTab>('throughput')
  const gradId = useId().replace(/:/g, '')
  const svgRef = useRef<SVGSVGElement>(null)
  const chartWrapRef = useRef<HTMLDivElement>(null)

  const [hover, setHover] = useState<{
    point: ChartPoint
    idx: number
    tipLeft: number
    tipTop: number
  } | null>(null)

  const { lineD, areaD, peakMax } = useMemo(
    () => buildThroughputSeriesPaths(chartPoints, tab),
    [chartPoints, tab],
  )

  const { width: cw, height: ch } = chartDimensions()
  const strokeColor = tab === 'throughput' ? 'var(--lun-primary)' : 'var(--lun-error-fg)'
  const fillUrl = `url(#${gradId}-fill)`

  const handleChartMouseMove = (e: React.MouseEvent<SVGRectElement>) => {
    const svg = e.currentTarget.ownerSVGElement
    const wrap = chartWrapRef.current
    if (!svg || !wrap || chartPoints.length === 0) {
      return
    }
    const p = svgPointFromClient(svg, e.clientX, e.clientY)
    if (!p) {
      return
    }
    const idx = chartIndexFromSvgX(p.x, chartPoints.length)
    if (idx < 0 || idx >= chartPoints.length) {
      return
    }
    const rect = wrap.getBoundingClientRect()
    setHover({
      point: chartPoints[idx],
      idx,
      tipLeft: e.clientX - rect.left,
      tipTop: e.clientY - rect.top,
    })
  }

  const handleChartLeave = () => {
    setHover(null)
  }

  return (
    <section className="obs-stage" aria-label="Signals">
      <div className="obs-panel obs-panel--throughput">
        <div className="obs-panel__head">
          <h2 className="obs-panel__title">Service throughput</h2>
          <div className="obs-panel__tabs" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={tab === 'throughput'}
              className={`obs-panel__tab${tab === 'throughput' ? ' active' : ''}`}
              onClick={() => setTab('throughput')}
            >
              RPS
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={tab === 'errors'}
              className={`obs-panel__tab${tab === 'errors' ? ' active' : ''}`}
              onClick={() => setTab('errors')}
            >
              Errors
            </button>
          </div>
        </div>

        <div className="obs-chart-summary">
          <span className="obs-panel__title obs-chart__caption">
            {tab === 'throughput'
              ? `Lines/sec · peak ${chartPoints.length === 0 ? '—' : peakMax.toFixed(0)}`
              : `Errors/sec · peak ${chartPoints.length === 0 ? '—' : peakMax.toFixed(0)}`}
          </span>
          {chartPoints.length === 0 && status === 'live' && (
            <span className="obs-chart__waiting">Waiting for /topic/metrics…</span>
          )}
        </div>

        <div
          ref={chartWrapRef}
          className="obs-chart obs-chart--footer"
          onMouseLeave={handleChartLeave}
        >
          {hover && (
            <div
              className="obs-chart-tooltip"
              style={{ left: hover.tipLeft, top: hover.tipTop }}
              role="tooltip"
            >
              <div className="obs-chart-tooltip__time">{formatChartTooltipTime(hover.point.t)}</div>
              <div className="obs-chart-tooltip__row">
                <span>Lines/s</span>
                <strong>{hover.point.rps.toFixed(0)}</strong>
              </div>
              <div className="obs-chart-tooltip__row">
                <span>Errors/s</span>
                <strong>{hover.point.errorsPerSecond}</strong>
              </div>
              <div className="obs-chart-tooltip__row">
                <span>Errors (rolling)</span>
                <strong>{hover.point.errorCount}</strong>
              </div>
              <div className="obs-chart-tooltip__row">
                <span>Error rate</span>
                <strong>{hover.point.errorRate.toFixed(1)}%</strong>
              </div>
            </div>
          )}
          <svg
            ref={svgRef}
            className="obs-chart__svg"
            viewBox={`0 0 ${cw} ${ch}`}
            preserveAspectRatio="none"
            aria-hidden
          >
            <defs>
              <linearGradient id={`${gradId}-fill`} x1="0" y1="0" x2="0" y2="1">
                {tab === 'throughput' ? (
                  <>
                    <stop offset="0%" stopColor="rgba(255,132,0,0.35)" />
                    <stop offset="100%" stopColor="rgba(255,132,0,0)" />
                  </>
                ) : (
                  <>
                    <stop offset="0%" stopColor="rgba(255,92,51,0.35)" />
                    <stop offset="100%" stopColor="rgba(255,92,51,0)" />
                  </>
                )}
              </linearGradient>
            </defs>
            <line x1="0" y1={ch - 24} x2={cw} y2={ch - 24} stroke="rgba(255,255,255,0.08)" />
            {areaD ? <path d={areaD} fill={fillUrl} /> : null}
            <path d={lineD} fill="none" stroke={strokeColor} strokeWidth="2" vectorEffect="non-scaling-stroke" />
            <rect
              width={cw}
              height={ch}
              fill="transparent"
              className="obs-chart__hit"
              style={{ cursor: chartPoints.length ? 'crosshair' : 'default' }}
              onMouseMove={handleChartMouseMove}
            />
          </svg>
        </div>
      </div>

      <div className="obs-panel">
        <div className="obs-panel__head obs-panel__head--logs">
          <div className="obs-panel__head-left">
            <h2 className="obs-panel__title">Live log stream</h2>
            <span className="obs-panel__title obs-panel__title--muted">Parsing · JSON</span>
          </div>
          <div className="obs-log-stream-status" role="status" aria-live="polite">
            <span
              className={`obs-log-stream-status__dot obs-log-stream-status__dot--${status === 'live' ? 'live' : status === 'connecting' ? 'connecting' : status === 'error' ? 'error' : 'idle'}`}
            />
            <span className="obs-log-stream-status__text">
              {status === 'live' && 'WS connected'}
              {status === 'connecting' && 'Connecting…'}
              {status === 'error' && (lastError ?? 'Disconnected')}
              {status === 'idle' && 'Idle'}
            </span>
          </div>
        </div>
        <div className="obs-logs" role="log" aria-live="polite">
          {lines.length === 0 && (
            <div className="obs-logs__empty">
              {status === 'connecting' && 'Opening WebSocket…'}
              {status === 'error' && (lastError ?? 'WebSocket unavailable')}
              {status === 'live' && 'Connected — listening on /topic/logs'}
              {status === 'idle' && 'Stream idle'}
            </div>
          )}
          {lines.map((line) => (
            <div key={line.id} className="obs-logs__line">
              <span className="obs-logs__ts">{line.ts}</span>
              <span className="obs-logs__svc" title={line.service}>
                {line.service}
              </span>
              <span
                className={`obs-logs__lvl obs-logs__lvl--${line.lvl === 'info' ? 'info' : line.lvl === 'warn' ? 'warn' : line.lvl === 'debug' ? 'debug' : 'err'}`}
              >
                {line.levelLabel}
              </span>
              <span className="obs-logs__msg">{line.msg}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
