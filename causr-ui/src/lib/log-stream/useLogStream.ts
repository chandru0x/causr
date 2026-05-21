import { Client } from '@stomp/stompjs'
import { useCallback, useEffect, useRef, useState } from 'react'
import { anomalyId, parseAnomalyDto } from '../anomaly-stream/anomalyDto'
import type { AnomalyDto } from '../anomaly-stream/anomalyDto'
import type { FleetServicesDto } from './fleetServicesDto'
import { parseFleetServicesDto } from './fleetServicesDto'
import type { HostMetricsDto } from './hostMetricsDto'
import { parseHostMetricsDto } from './hostMetricsDto'
import type { LogDto } from './logDto'
import { parseLogDto } from './logDto'
import type { ChartPoint, MetricsDto } from './metricsDto'
import { metricsDtoToChartPoint, parseMetricsDto } from './metricsDto'
import { resolveLogWsUrl } from './resolveLogWsUrl'

const LOG_TOPIC = '/topic/logs'
const METRICS_TOPIC = '/topic/metrics'
const FLEET_SERVICES_TOPIC = '/topic/fleet-services'
const HOST_METRICS_TOPIC = '/topic/host-metrics'
const ANOMALIES_TOPIC = '/topic/anomalies'
const MAX_LINES = 500
const MAX_CHART_POINTS = 60
const MAX_ANOMALIES = 200

export type LogLineView = {
  id: string
  ts: string
  service: string
  lvl: 'info' | 'warn' | 'err' | 'debug'
  levelLabel: string
  msg: string
}

export type AnomalyView = AnomalyDto & { id: string }

export type LogStreamTopics = {
  logs?: boolean
  metrics?: boolean
  fleet?: boolean
  host?: boolean
  anomalies?: boolean
}

const DEFAULT_TOPICS: Required<LogStreamTopics> = {
  logs: true,
  metrics: true,
  fleet: true,
  host: true,
  anomalies: false,
}

function formatTimestamp(ms: number): string {
  const d = new Date(ms)
  const hh = String(d.getHours()).padStart(2, '0')
  const mm = String(d.getMinutes()).padStart(2, '0')
  const ss = String(d.getSeconds()).padStart(2, '0')
  const sss = String(d.getMilliseconds()).padStart(3, '0')
  return `${hh}:${mm}:${ss}.${sss}`
}

function mapLevel(level: string): LogLineView['lvl'] {
  const u = level.toUpperCase()
  if (u === 'ERROR' || u === 'FATAL') return 'err'
  if (u === 'WARN') return 'warn'
  if (u === 'DEBUG' || u === 'TRACE') return 'debug'
  return 'info'
}

function dtoToLine(dto: LogDto, seq: number): LogLineView {
  return {
    id: `${dto.timestampEpochMillis}-${seq}`,
    ts: formatTimestamp(dto.timestampEpochMillis),
    service: dto.serviceName || 'unknown',
    lvl: mapLevel(dto.level),
    levelLabel: (dto.level || 'INFO').toUpperCase(),
    msg: dto.message ?? '',
  }
}

function mergeTopics(topics?: LogStreamTopics): Required<LogStreamTopics> {
  return { ...DEFAULT_TOPICS, ...topics }
}

export type LogStreamStatus = 'idle' | 'connecting' | 'live' | 'error'

export function useLogStream(enabled = true, topics?: LogStreamTopics) {
  const activeTopics = mergeTopics(topics)

  const [lines, setLines] = useState<LogLineView[]>([])
  const [chartPoints, setChartPoints] = useState<ChartPoint[]>([])
  const [latestMetrics, setLatestMetrics] = useState<MetricsDto | null>(null)
  const [latestFleetServices, setLatestFleetServices] = useState<FleetServicesDto | null>(null)
  const [latestHostMetrics, setLatestHostMetrics] = useState<HostMetricsDto | null>(null)
  const [anomalies, setAnomalies] = useState<AnomalyView[]>([])
  const [status, setStatus] = useState<LogStreamStatus>(() => (enabled ? 'connecting' : 'idle'))
  const [lastError, setLastError] = useState<string | null>(null)
  const seqRef = useRef(0)
  const anomalySeqRef = useRef(0)

  const pushDto = useCallback((dto: LogDto) => {
    seqRef.current += 1
    const line = dtoToLine(dto, seqRef.current)
    setLines((prev) => {
      const next = [line, ...prev]
      return next.length > MAX_LINES ? next.slice(0, MAX_LINES) : next
    })
  }, [])

  const pushMetrics = useCallback((point: ChartPoint) => {
    setChartPoints((prev) => {
      const next = [...prev, point]
      return next.length > MAX_CHART_POINTS ? next.slice(-MAX_CHART_POINTS) : next
    })
  }, [])

  const pushAnomaly = useCallback((dto: AnomalyDto) => {
    anomalySeqRef.current += 1
    const view: AnomalyView = {
      ...dto,
      id: `${anomalyId(dto)}-${anomalySeqRef.current}`,
    }
    setAnomalies((prev) => {
      const next = [view, ...prev]
      return next.length > MAX_ANOMALIES ? next.slice(0, MAX_ANOMALIES) : next
    })
  }, [])

  useEffect(() => {
    if (!enabled) {
      return
    }

    const client = new Client({
      brokerURL: resolveLogWsUrl(),
      reconnectDelay: 4000,
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,
      debug: () => {},
    })

    client.onConnect = () => {
      setStatus('live')
      setLastError(null)

      if (activeTopics.logs) {
        client.subscribe(LOG_TOPIC, (frame) => {
          const dto = parseLogDto(frame.body)
          if (dto) {
            pushDto(dto)
          }
        })
      }

      if (activeTopics.metrics) {
        client.subscribe(METRICS_TOPIC, (frame) => {
          const dto = parseMetricsDto(frame.body)
          if (dto) {
            setLatestMetrics(dto)
            pushMetrics(metricsDtoToChartPoint(dto))
          }
        })
      }

      if (activeTopics.fleet) {
        client.subscribe(FLEET_SERVICES_TOPIC, (frame) => {
          const dto = parseFleetServicesDto(frame.body)
          if (dto) {
            setLatestFleetServices(dto)
          }
        })
      }

      if (activeTopics.host) {
        client.subscribe(HOST_METRICS_TOPIC, (frame) => {
          const dto = parseHostMetricsDto(frame.body)
          if (dto) {
            setLatestHostMetrics(dto)
          }
        })
      }

      if (activeTopics.anomalies) {
        client.subscribe(ANOMALIES_TOPIC, (frame) => {
          const dto = parseAnomalyDto(frame.body)
          if (dto) {
            pushAnomaly(dto)
          }
        })
      }
    }

    client.onStompError = (frame) => {
      const msg = frame.headers['message'] ?? frame.body ?? 'STOMP broker error'
      setLastError(msg)
      setStatus('error')
    }

    client.onWebSocketError = () => {
      setLastError(
        import.meta.env.DEV
          ? 'WebSocket failed — check Causr-log-processor (or set VITE_LOG_WS_URL).'
          : 'WebSocket error (check VITE_LOG_WS_URL / server availability).',
      )
      setStatus('error')
    }

    client.activate()

    return () => {
      void client.deactivate()
      queueMicrotask(() => {
        setStatus('idle')
        setChartPoints([])
        setLatestMetrics(null)
        setLatestFleetServices(null)
        setLatestHostMetrics(null)
        setAnomalies([])
        anomalySeqRef.current = 0
      })
    }
  }, [
    enabled,
    activeTopics.logs,
    activeTopics.metrics,
    activeTopics.fleet,
    activeTopics.host,
    activeTopics.anomalies,
    pushDto,
    pushMetrics,
    pushAnomaly,
  ])

  return {
    lines,
    chartPoints,
    latestMetrics,
    latestFleetServices,
    latestHostMetrics,
    anomalies,
    status,
    lastError,
  }
}
