import './ai-incident-intelligence.css'
import { UnderDevelopmentPanel } from '../../components/under-development/UnderDevelopmentPanel'
import { uiFlags } from '../../config/uiFlags'
import { AiIncidentIntelligenceFeed } from './AiIncidentIntelligenceFeed'
import { AiIncidentIntelligenceRail } from './AiIncidentIntelligenceRail'
import { AiIncidentIntelligenceTopBar } from './AiIncidentIntelligenceTopBar'

const AI_UNDER_DEV_TITLE = 'Under development'
const AI_UNDER_DEV_DESCRIPTION =
  'AI Incident Intelligence is coming soon. Unified reasoning across logs, metrics, and traces will be available in a future release.'

export function AiIncidentIntelligencePage() {
  return (
    <div className="ai-page">
      <AiIncidentIntelligenceTopBar />
      {uiFlags.showAiIncidentIntelligence ? (
        <div className="ai-layout">
          <AiIncidentIntelligenceFeed />
          <AiIncidentIntelligenceRail />
        </div>
      ) : (
        <UnderDevelopmentPanel
          title={AI_UNDER_DEV_TITLE}
          description={AI_UNDER_DEV_DESCRIPTION}
        />
      )}
    </div>
  )
}
