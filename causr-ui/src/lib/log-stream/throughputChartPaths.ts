import type { ChartPoint } from './metricsDto'

export type ThroughputTab = 'throughput' | 'errors'

const W = 400
const H = 180
const PAD_X = 12
const PAD_TOP = 16
const PAD_BOTTOM = 24

function valueForTab(p: ChartPoint, tab: ThroughputTab): number {
  return tab === 'throughput' ? p.rps : p.errorsPerSecond
}

/**
 * Builds SVG path `d` for line and filled area under the line from metrics history.
 */
export function buildThroughputSeriesPaths(
  points: ChartPoint[],
  tab: ThroughputTab,
): { lineD: string; areaD: string; maxY: number; peakMax: number } {
  if (points.length === 0) {
    const y = H - PAD_BOTTOM
    return {
      lineD: `M ${PAD_X} ${y} L ${W - PAD_X} ${y}`,
      areaD: '',
      maxY: 1,
      peakMax: 0,
    }
  }

  const values = points.map((p) => valueForTab(p, tab))
  const peakMax = Math.max(...values, 0)
  const maxRaw = Math.max(peakMax, 1e-9)
  const innerW = W - 2 * PAD_X
  const innerH = H - PAD_TOP - PAD_BOTTOM

  const coords = points.map((p, i) => {
    const v = valueForTab(p, tab)
    const x =
      points.length <= 1
        ? PAD_X + innerW / 2
        : PAD_X + (i / (points.length - 1)) * innerW
    const y = PAD_TOP + innerH * (1 - v / maxRaw)
    return { x, y }
  })

  const lineD =
    coords.length === 1
      ? `M ${coords[0].x - 1} ${coords[0].y} L ${coords[0].x + 1} ${coords[0].y}`
      : coords.map((c, i) => (i === 0 ? `M ${c.x} ${c.y}` : `L ${c.x} ${c.y}`)).join(' ')

  const baseY = H - PAD_BOTTOM
  const first = coords[0]
  const last = coords[coords.length - 1]
  const areaD =
    coords.length > 0
      ? coords.length === 1
        ? `${lineD} L ${coords[0].x + 1} ${baseY} L ${coords[0].x - 1} ${baseY} Z`
        : `${lineD} L ${last.x} ${baseY} L ${first.x} ${baseY} Z`
      : ''

  return { lineD, areaD, maxY: maxRaw, peakMax }
}

export function chartDimensions(): { width: number; height: number } {
  return { width: W, height: H }
}

/**
 * Map an x-coordinate in SVG user space to the nearest metrics sample index.
 */
export function chartIndexFromSvgX(svgX: number, pointCount: number): number {
  if (pointCount <= 0) {
    return -1
  }
  if (pointCount === 1) {
    return 0
  }
  const innerW = W - 2 * PAD_X
  const clamped = Math.min(Math.max(svgX, PAD_X), PAD_X + innerW)
  const frac = (clamped - PAD_X) / innerW
  return Math.round(frac * (pointCount - 1))
}
