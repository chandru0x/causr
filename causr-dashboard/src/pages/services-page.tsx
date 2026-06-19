import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, RefreshCw } from 'lucide-react';
import { codeSourceLabel, fetchServices, saveServiceCodeSource } from '@/api/services';
import { LinkCodeModal } from '@/components/link-code-modal';
import { PageHeader } from '@/components/page-header';
import { ServiceStatusBadge } from '@/components/service-status-badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import type { ServiceRow, UpdateServicePayload } from '@/types/services';

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
      <PageHeader
        title="Services"
        description="Auto-discovered from OpenTelemetry service.name. Link Git or a local path for Andromedia indexing."
        actions={
          <>
            <span className="text-xs text-muted-foreground">{rows.length} services</span>
            <Button variant="outline" size="sm" onClick={() => void load()}>
              <RefreshCw className="size-4" />
              Refresh
            </Button>
          </>
        }
      />

      {error && (
        <Alert variant="destructive" className="mb-5">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription className="flex items-center justify-between gap-4">
            <span>{error}</span>
            <Button variant="outline" size="sm" onClick={() => void load()}>
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {loading && rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : rows.length === 0 ? (
        <Card>
          <CardContent className="py-7 text-center text-sm text-muted-foreground">
            No services discovered yet. Send OTLP logs with a service name.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {rows.map((row) => (
            <Card key={row.serviceName}>
              <CardContent className="flex flex-col gap-3.5 p-3.5 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      to={`/services/${encodeURIComponent(row.serviceName)}`}
                      className="font-medium hover:underline"
                    >
                      {row.serviceName}
                    </Link>
                    <ServiceStatusBadge status={row.status} />
                    {row.indexSource === 'local' && row.codeSourceLinked && (
                      <Badge variant="outline">Local</Badge>
                    )}
                  </div>
                  <p className="truncate font-mono text-xs text-muted-foreground">
                    {row.codeSourceLinked ? codeSourceLabel(row) : 'Code source: not linked'}
                  </p>
                </div>
                <div className="flex shrink-0 flex-wrap gap-2">
                  {!row.codeSourceLinked && (
                    <Button size="sm" onClick={() => setModalService(row)}>
                      Link code
                    </Button>
                  )}
                  <Button variant="outline" size="sm" asChild>
                    <Link to={`/services/${encodeURIComponent(row.serviceName)}`}>
                      Details
                      <ArrowRight className="size-4" />
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
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
