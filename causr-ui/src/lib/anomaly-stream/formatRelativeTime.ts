export function formatRelativeTime(timestampMs: number, nowMs = Date.now()): string {
  const diffSec = Math.max(0, Math.floor((nowMs - timestampMs) / 1000))

  if (diffSec < 60) {
    return `${diffSec}s ago`
  }

  const diffMin = Math.floor(diffSec / 60)

  if (diffMin < 60) {
    return `${diffMin}m ago`
  }

  const diffHr = Math.floor(diffMin / 60)

  if (diffHr < 24) {
    return `${diffHr}h ago`
  }

  const diffDay = Math.floor(diffHr / 24)

  return `${diffDay}d ago`
}

export function formatTimestamp(timestampMs: number): string {
  const d = new Date(timestampMs)
  const hh = String(d.getHours()).padStart(2, '0')
  const mm = String(d.getMinutes()).padStart(2, '0')
  const ss = String(d.getSeconds()).padStart(2, '0')
  return `${hh}:${mm}:${ss}`
}
