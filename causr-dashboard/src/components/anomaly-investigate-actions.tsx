import { useState } from 'react';
import { Link } from 'react-router-dom';
import { investigateService } from '@/api/services';
import { InvestigationResultPanel } from '@/components/investigation-result-panel';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import type { AnomalyRow } from '@/types/dashboard';
import type { InvestigateResult, ServiceRow } from '@/types/services';

interface AnomalyInvestigateActionsProps {
  anomaly: AnomalyRow;
  service: ServiceRow | undefined;
}

export function AnomalyInvestigateActions({ anomaly, service }: AnomalyInvestigateActionsProps) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<InvestigateResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const serviceName = String(anomaly.service_name ?? '');
  const canInvestigate = service?.indexed;

  const handleInvestigate = async () => {
    if (!serviceName) {
      return;
    }
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const investigation = await investigateService(serviceName, {
        query: `Investigate anomaly for ${serviceName} score ${anomaly.anomaly_score}`,
        context: {
          anomalyId: anomaly.id,
          windowStart: anomaly.window_start,
          windowEnd: anomaly.window_end,
          featureJson: anomaly.feature_json,
        },
      });
      setResult(investigation);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Investigation failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      {canInvestigate ? (
        <Button onClick={() => void handleInvestigate()} disabled={loading} size="sm">
          {loading ? 'Investigating…' : 'Investigate with Andromedia'}
        </Button>
      ) : (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-muted-foreground">Service not indexed yet.</span>
          {serviceName && (
            <Button variant="outline" size="sm" asChild>
              <Link to={`/services/${encodeURIComponent(serviceName)}`}>Link code</Link>
            </Button>
          )}
        </div>
      )}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      {(loading || result) && (
        <InvestigationResultPanel result={result} loading={loading} compact />
      )}
    </div>
  );
}
