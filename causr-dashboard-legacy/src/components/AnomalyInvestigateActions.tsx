import { Link } from 'react-router-dom';
import { investigateService } from '../api/services';
import type { ServiceRow } from '../types/services';
import type { AnomalyRow } from '../types/dashboard';
import { useState } from 'react';

interface AnomalyInvestigateActionsProps {
  anomaly: AnomalyRow;
  service: ServiceRow | undefined;
}

export function AnomalyInvestigateActions({ anomaly, service }: AnomalyInvestigateActionsProps) {
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState<string | null>(null);
  const [details, setDetails] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const serviceName = String(anomaly.service_name ?? '');
  const canInvestigate = service?.indexed;

  const handleInvestigate = async () => {
    if (!serviceName) {
      return;
    }
    setLoading(true);
    setError(null);
    setSummary(null);
    setDetails(null);
    try {
      const result = await investigateService(serviceName, {
        query: `Investigate anomaly for ${serviceName} score ${anomaly.anomaly_score}`,
        context: {
          anomalyId: anomaly.id,
          windowStart: anomaly.window_start,
          windowEnd: anomaly.window_end,
          featureJson: anomaly.feature_json,
        },
      });
      setSummary(result.summary);
      setDetails(result.details);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Investigation failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="anomaly-investigate">
      {canInvestigate ? (
        <button
          type="button"
          className="btn-primary"
          onClick={() => void handleInvestigate()}
          disabled={loading}
        >
          {loading ? 'Investigating…' : 'Investigate with Andro'}
        </button>
      ) : (
        <>
          <span className="service-not-linked">⚠ Service not indexed</span>
          {serviceName && (
            <Link
              to={`/services/${encodeURIComponent(serviceName)}`}
              className="btn-secondary btn-link"
            >
              Link Code
            </Link>
          )}
        </>
      )}
      {error && <p className="hint" style={{ color: 'var(--err)' }}>{error}</p>}
      {summary && <p>{summary}</p>}
      {details && <pre className="anomaly-rca mono">{details}</pre>}
    </div>
  );
}
