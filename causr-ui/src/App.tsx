import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { LunarisShell } from './components/lunaris-shell/LunarisShell'
import { AiIncidentIntelligencePage } from './features/ai-incident-intelligence/AiIncidentIntelligencePage'
import { AlertsIncidentsPage } from './features/alerts-incidents/AlertsIncidentsPage'
import { ObservabilityLivePage } from './features/observability-live/ObservabilityLivePage'

export default function App() {
  return (
    <BrowserRouter>
      <LunarisShell>
        <Routes>
          <Route path="/" element={<Navigate to="/observability" replace />} />
          <Route path="/observability" element={<ObservabilityLivePage />} />
          <Route path="/alerts" element={<AlertsIncidentsPage />} />
          <Route path="/ai-intelligence" element={<AiIncidentIntelligencePage />} />
        </Routes>
      </LunarisShell>
    </BrowserRouter>
  )
}
