import { uiFlags } from '../../config/uiFlags'
import { useLogStream } from '../../lib/log-stream/useLogStream'
import { ObservabilityFleetTable } from './ObservabilityFleetTable'
import { ObservabilityInfraLayer } from './ObservabilityInfraLayer'
import { ObservabilityKpiRow } from './ObservabilityKpiRow'
import { ObservabilityMainStage } from './ObservabilityMainStage'
import { ObservabilitySidebar } from './ObservabilitySidebar'
import { ObservabilityTopBar } from './ObservabilityTopBar'
import { ObservabilityTracesStrip } from './ObservabilityTracesStrip'

export function ObservabilityLivePage() {
  const { lines, chartPoints, latestMetrics, latestFleetServices, latestHostMetrics, status, lastError } =
    useLogStream(true)
  const streamLive = status === 'live'

  return (
    <>
      <ObservabilityTopBar />
      <ObservabilitySidebar showRail={uiFlags.showObservabilitySidebar}>
        <ObservabilityKpiRow fleet={latestMetrics} streamLive={streamLive} />
        <ObservabilityInfraLayer hostMetrics={latestHostMetrics} streamLive={streamLive} />
        <ObservabilityMainStage
          lines={lines}
          chartPoints={chartPoints}
          status={status}
          lastError={lastError}
        />
        <ObservabilityFleetTable
          fleet={latestFleetServices}
          streamLive={streamLive}
          hostMetrics={latestHostMetrics}
        />
        {uiFlags.showDistributedTraces && <ObservabilityTracesStrip />}
      </ObservabilitySidebar>
    </>
  )
}
