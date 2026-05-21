export type AnomalyBadgeVariant = 'crit' | 'warn' | 'info'

const TYPE_LABELS: Record<string, string> = {
  HIGH_ERROR_RATE: 'High error rate',
  HIGH_P99: 'P99 latency spike',
  TRAFFIC_DROP: 'Traffic drop',
  SERVICE_DOWN: 'Service down',
  CPU_SPIKE: 'CPU spike',
  MEMORY_LEAK: 'Memory leak',
}

export function anomalyTypeLabel(type: string): string {
  return TYPE_LABELS[type] ?? type.replace(/_/g, ' ').toLowerCase()
}

export function severityBadgeVariant(severity: string): AnomalyBadgeVariant {
  const s = severity.toLowerCase()
  if (s === 'critical') return 'crit'
  if (s === 'warning') return 'warn'
  return 'info'
}

export function severityLabel(severity: string): string {
  return severity.charAt(0).toUpperCase() + severity.slice(1).toLowerCase()
}
