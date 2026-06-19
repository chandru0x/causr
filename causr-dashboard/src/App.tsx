import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { AppShell } from '@/components/layout/app-shell';
import { AnomaliesPage } from '@/pages/anomalies-page';
import { DashboardPage } from '@/pages/dashboard-page';
import { LogsPage } from '@/pages/logs-page';
import { ServiceDetailPage } from '@/pages/service-detail-page';
import { ServicesPage } from '@/pages/services-page';

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppShell />}>
          <Route index element={<DashboardPage />} />
          <Route path="logs" element={<LogsPage />} />
          <Route path="anomalies" element={<AnomaliesPage />} />
          <Route path="services" element={<ServicesPage />} />
          <Route path="services/:serviceName" element={<ServiceDetailPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
