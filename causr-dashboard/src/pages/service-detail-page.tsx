import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import {
  fetchService,
  investigateService,
  reindexService,
  saveServiceCodeSource,
} from '@/api/services';
import { InvestigationResultPanel } from '@/components/investigation-result-panel';
import { LinkCodeModal } from '@/components/link-code-modal';
import { PageHeader } from '@/components/page-header';
import { ServiceStatusBadge } from '@/components/service-status-badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import type { InvestigateResult, ServiceRow, UpdateServicePayload } from '@/types/services';

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
    return <p className="text-sm text-muted-foreground">Missing service name.</p>;
  }

  return (
    <>
      <div className="mb-3.5">
        <Button variant="ghost" size="sm" asChild className="-ml-2">
          <Link to="/services">
            <ArrowLeft className="size-4" />
            All services
          </Link>
        </Button>
      </div>

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

      {loading && !row ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : !row ? (
        <p className="text-sm text-muted-foreground">Service not found.</p>
      ) : (
        <>
          <PageHeader
            title={row.serviceName}
            description="Code source, index status, and Andromedia investigation."
            actions={<ServiceStatusBadge status={row.status} />}
          />

          <Card className="mb-5">
            <CardHeader>
              <CardTitle className="text-base">Code source</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3.5">
              <dl className="grid gap-3.5 sm:grid-cols-2">
                <div>
                  <dt className="text-xs font-medium text-muted-foreground">Source type</dt>
                  <dd className="mt-1 text-sm">{row.codeSourceLinked ? row.indexSource : 'Not linked'}</dd>
                </div>
                {row.indexSource === 'local' ? (
                  <div className="sm:col-span-2">
                    <dt className="text-xs font-medium text-muted-foreground">Local path</dt>
                    <dd className="mt-1 font-mono text-sm break-all">{row.localPath ?? '—'}</dd>
                  </div>
                ) : (
                  <>
                    <div className="sm:col-span-2">
                      <dt className="text-xs font-medium text-muted-foreground">Repository</dt>
                      <dd className="mt-1 font-mono text-sm break-all">
                        {row.repositoryLinked ? row.repoUrl : 'Not linked'}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs font-medium text-muted-foreground">Branch</dt>
                      <dd className="mt-1 text-sm">{row.branch}</dd>
                    </div>
                    {row.repoSubpath && (
                      <div>
                        <dt className="text-xs font-medium text-muted-foreground">Subfolder</dt>
                        <dd className="mt-1 font-mono text-sm">{row.repoSubpath}</dd>
                      </div>
                    )}
                    {row.clonePath && (
                      <div className="sm:col-span-2">
                        <dt className="text-xs font-medium text-muted-foreground">Clone path</dt>
                        <dd className="mt-1 font-mono text-sm break-all">{row.clonePath}</dd>
                      </div>
                    )}
                  </>
                )}
                {row.indexPath && (
                  <div className="sm:col-span-2">
                    <dt className="text-xs font-medium text-muted-foreground">Index path</dt>
                    <dd className="mt-1 font-mono text-sm break-all">{row.indexPath}</dd>
                  </div>
                )}
                <div>
                  <dt className="text-xs font-medium text-muted-foreground">Last sync</dt>
                  <dd className="mt-1 text-sm">{row.indexedAt ?? '—'}</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-muted-foreground">Files indexed</dt>
                  <dd className="mt-1 font-mono text-sm">{statValue(row.indexStats, 'filesIndexed')}</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-muted-foreground">Embeddings</dt>
                  <dd className="mt-1 font-mono text-sm">{statValue(row.indexStats, 'chunksEmbedded')}</dd>
                </div>
              </dl>

              <p className="text-xs text-muted-foreground">
                OpenTelemetry discovers service names from telemetry only; it does not locate source
                code on disk.
              </p>

              <Separator />

              <div className="flex flex-wrap gap-2">
                {!row.codeSourceLinked && (
                  <Button onClick={() => setModalOpen(true)}>Link code</Button>
                )}
                {row.codeSourceLinked && (
                  <Button variant="outline" onClick={() => setModalOpen(true)}>
                    Edit code source
                  </Button>
                )}
                {row.codeSourceLinked && (
                  <Button
                    variant="outline"
                    onClick={() => void handleReindex()}
                    disabled={reindexing || row.status === 'indexing'}
                  >
                    {reindexing || row.status === 'indexing' ? 'Reindexing…' : 'Reindex'}
                  </Button>
                )}
                {row.indexed && (
                  <Button onClick={() => void handleInvestigate()} disabled={investigating}>
                    {investigating ? 'Investigating…' : 'Investigate'}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {(investigating || investigation) && (
            <InvestigationResultPanel result={investigation} loading={investigating} />
          )}
        </>
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
