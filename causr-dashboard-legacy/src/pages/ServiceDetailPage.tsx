import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  fetchService,
  investigateService,
  reindexService,
  saveServiceCodeSource,
  serviceStatusLabel,
} from '../api/services';
import { ErrorBanner } from '../components/ErrorBanner';
import { LinkCodeModal } from '../components/LinkCodeModal';
import { PageTitle } from '../components/PageTitle';
import { ServicesIcon } from '../components/ServicesIcon';
import type { InvestigateResult, ServiceRow, UpdateServicePayload } from '../types/services';

function statValue(stats: Record<string, unknown>, key: string): string {
  const value = stats[key];
  if (value == null) {
    return '—';
  }
  return String(value);
}

export function ServiceDetailPage() {
  const { serviceName: encodedName } = useParams();
  const serviceName = encodedName ? decodeURIComponent(encodedName) : '';
  const [row, setRow] = useState<ServiceRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [reindexing, setReindexing] = useState(false);
  const [investigating, setInvestigating] = useState(false);
  const [investigation, setInvestigation] = useState<InvestigateResult | null>(null);

  const load = useCallback(async () => {
    if (!serviceName) {
      return;
    }
    try {
      const data = await fetchService(serviceName);
      setRow(data);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load service');
    } finally {
      setLoading(false);
    }
  }, [serviceName]);

  useEffect(() => {
    void load();
    const timer = setInterval(() => {
      if (row?.status === 'indexing') {
        void load();
      }
    }, 5000);
    return () => clearInterval(timer);
  }, [load, row?.status]);

  const handleSave = async (payload: UpdateServicePayload) => {
    setSaving(true);
    try {
      await saveServiceCodeSource(serviceName, payload);
      setModalOpen(false);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save code source');
    } finally {
      setSaving(false);
    }
  };

  const handleReindex = async () => {
    setReindexing(true);
    try {
      await reindexService(serviceName);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to reindex');
    } finally {
      setReindexing(false);
    }
  };

  const handleInvestigate = async () => {
    setInvestigating(true);
    setInvestigation(null);
    try {
      const result = await investigateService(serviceName, {
        query: `Investigate potential issues in ${serviceName}`,
      });
      setInvestigation(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Investigation failed');
    } finally {
      setInvestigating(false);
    }
  };

  if (!serviceName) {
    return <div className="hint">Missing service name.</div>;
  }

  return (
    <>
      <div className="page-header">
        <PageTitle icon={<ServicesIcon width={18} height={18} />} title="Service Details" />
        <Link to="/services" className="page-meta">
          ← All services
        </Link>
      </div>

      {error && <ErrorBanner message={error} onRetry={() => void load()} />}

      {loading && !row ? (
        <div className="hint">Loading…</div>
      ) : !row ? (
        <div className="hint">Service not found.</div>
      ) : (
        <div className="service-detail panel">
          <h2 className="panel-title">{row.serviceName}</h2>

          <dl className="service-detail-grid">
            <dt>Source Type</dt>
            <dd>{row.codeSourceLinked ? row.indexSource : 'Not Linked'}</dd>

            {row.indexSource === 'local' ? (
              <>
                <dt>Local Path</dt>
                <dd>{row.localPath ? <span className="mono">{row.localPath}</span> : '—'}</dd>
              </>
            ) : (
              <>
                <dt>Repository</dt>
                <dd>{row.repositoryLinked ? <span className="mono">{row.repoUrl}</span> : 'Not Linked'}</dd>

                <dt>Branch</dt>
                <dd>{row.branch}</dd>

                {row.repoSubpath && (
                  <>
                    <dt>Subpath</dt>
                    <dd className="mono">{row.repoSubpath}</dd>
                  </>
                )}
              </>
            )}

            <dt>Status</dt>
            <dd>
              <span className={`service-status service-status-${row.status}`}>
                {serviceStatusLabel(row.status)}
              </span>
            </dd>

            <dt>Last Sync</dt>
            <dd>{row.indexedAt ?? '—'}</dd>

            {row.indexPath && (
              <>
                <dt>Index Path</dt>
                <dd className="mono">{row.indexPath}</dd>
              </>
            )}

            {row.clonePath && (
              <>
                <dt>Clone Path</dt>
                <dd className="mono">{row.clonePath}</dd>
              </>
            )}

            <dt>Files Indexed</dt>
            <dd>{statValue(row.indexStats, 'filesIndexed')}</dd>

            <dt>Embeddings</dt>
            <dd>{statValue(row.indexStats, 'chunksEmbedded')}</dd>
          </dl>

          <p className="hint">
            OpenTelemetry discovers service names from telemetry only; it does not locate source code
            on disk. Use Git or Local to point Andromedia at the codebase.
          </p>

          <div className="service-item-actions">
            {!row.codeSourceLinked && (
              <button type="button" className="btn-primary" onClick={() => setModalOpen(true)}>
                Link Code
              </button>
            )}
            {row.codeSourceLinked && (
              <button type="button" className="btn-secondary" onClick={() => setModalOpen(true)}>
                Edit Code Source
              </button>
            )}
            {row.codeSourceLinked && (
              <button
                type="button"
                className="btn-secondary"
                onClick={() => void handleReindex()}
                disabled={reindexing || row.status === 'indexing'}
              >
                {reindexing || row.status === 'indexing' ? 'Reindexing…' : 'Reindex'}
              </button>
            )}
            {row.indexed && (
              <button
                type="button"
                className="btn-primary"
                onClick={() => void handleInvestigate()}
                disabled={investigating}
              >
                {investigating ? 'Investigating…' : 'Investigate'}
              </button>
            )}
          </div>

          {investigation && (
            <div className="investigation-result">
              <h3 className="panel-subtitle">Investigation</h3>
              <p>{investigation.summary}</p>
              {investigation.details && (
                <pre className="anomaly-rca mono">{investigation.details}</pre>
              )}
            </div>
          )}
        </div>
      )}

      <LinkCodeModal
        open={modalOpen}
        serviceName={serviceName}
        initialIndexSource={row?.indexSource ?? 'git'}
        initialRepoUrl={row?.repoUrl ?? ''}
        initialBranch={row?.branch ?? 'main'}
        initialLocalPath={row?.localPath ?? ''}
        initialRepoSubpath={row?.repoSubpath ?? ''}
        saving={saving}
        onClose={() => setModalOpen(false)}
        onSave={(payload) => void handleSave(payload)}
      />
    </>
  );
}
