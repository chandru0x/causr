import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  codeSourceLabel,
  fetchServices,
  saveServiceCodeSource,
  serviceStatusLabel,
} from '../api/services';
import { ErrorBanner } from '../components/ErrorBanner';
import { LinkCodeModal } from '../components/LinkCodeModal';
import { PageTitle } from '../components/PageTitle';
import { ServicesIcon } from '../components/ServicesIcon';
import type { ServiceRow, UpdateServicePayload } from '../types/services';

export function ServicesPage() {
  const [rows, setRows] = useState<ServiceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalService, setModalService] = useState<ServiceRow | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await fetchServices();
      setRows(data);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load services');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const handleSave = async (payload: UpdateServicePayload) => {
    if (!modalService) {
      return;
    }
    setSaving(true);
    try {
      await saveServiceCodeSource(modalService.serviceName, payload);
      setModalService(null);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save code source');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="page-header">
        <PageTitle icon={<ServicesIcon width={18} height={18} />} title="Services" />
        <div className="page-header-actions">
          <span className="page-meta">{rows.length} services</span>
          <button type="button" className="btn-refresh" onClick={() => void load()}>
            Refresh
          </button>
        </div>
      </div>

      <p className="hint">
        Services are auto-discovered from OpenTelemetry <code>service.name</code>. Link a Git
        repository or local path to enable Andromedia indexing and investigation.
      </p>

      {error && <ErrorBanner message={error} onRetry={() => void load()} />}

      {loading && rows.length === 0 ? (
        <div className="hint">Loading…</div>
      ) : rows.length === 0 ? (
        <div className="panel">
          <p className="hint">No services discovered yet. Send OTLP logs with a service name.</p>
        </div>
      ) : (
        <ul className="service-list">
          {rows.map((row) => (
            <li key={row.serviceName} className="service-item panel">
              <div className="service-item-main">
                <Link to={`/services/${encodeURIComponent(row.serviceName)}`} className="service-item-name">
                  {row.serviceName}
                </Link>
                <span className={`service-status service-status-${row.status}`}>
                  {serviceStatusLabel(row.status)}
                </span>
              </div>
              <div className="service-item-meta">
                {row.codeSourceLinked ? (
                  <span className="mono">{codeSourceLabel(row)}</span>
                ) : (
                  <span className="service-not-linked">Code source: Not Linked</span>
                )}
              </div>
              <div className="service-item-actions">
                {!row.codeSourceLinked && (
                  <button
                    type="button"
                    className="btn-primary"
                    onClick={() => setModalService(row)}
                  >
                    Link Code
                  </button>
                )}
                <Link
                  to={`/services/${encodeURIComponent(row.serviceName)}`}
                  className="btn-secondary btn-link"
                >
                  Details
                </Link>
              </div>
            </li>
          ))}
        </ul>
      )}

      <LinkCodeModal
        open={modalService != null}
        serviceName={modalService?.serviceName ?? ''}
        initialIndexSource={modalService?.indexSource ?? 'git'}
        initialRepoUrl={modalService?.repoUrl ?? ''}
        initialBranch={modalService?.branch ?? 'main'}
        initialLocalPath={modalService?.localPath ?? ''}
        initialRepoSubpath={modalService?.repoSubpath ?? ''}
        saving={saving}
        onClose={() => setModalService(null)}
        onSave={(payload) => void handleSave(payload)}
      />
    </>
  );
}
