import { useEffect, useMemo, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { fetchRecentLogs } from '@/api/processor';
import { PageHeader } from '@/components/page-header';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { LogRow } from '@/types/dashboard';
import { cn } from '@/lib/utils';

const POLL_MS = 2000;

function levelClass(level?: string): string {
  const l = (level ?? '').toUpperCase();
  if (l === 'ERROR') return 'text-destructive font-medium';
  if (l === 'WARN' || l === 'WARNING') return 'text-amber-600 dark:text-amber-400';
  return '';
}

export function LogsPage() {
  const [rows, setRows] = useState<LogRow[]>([]);
  const [service, setService] = useState('');
  const [level, setLevel] = useState('');
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    try {
      const data = await fetchRecentLogs();
      setRows(data);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load logs');
    }
  };

  useEffect(() => {
    void load();
    const t = setInterval(() => void load(), POLL_MS);
    return () => clearInterval(t);
  }, []);

  const filtered = useMemo(() => {
    return rows.filter((x) => {
      const sn = String(x.service_name ?? '');
      const lv = String(x.log_level ?? '');
      if (service && !sn.toLowerCase().includes(service.toLowerCase())) return false;
      if (level && !lv.toLowerCase().includes(level.toLowerCase())) return false;
      return true;
    });
  }, [rows, service, level]);

  return (
    <>
      <PageHeader
        title="Logs"
        description={`Live log stream from the processor (poll every ${POLL_MS / 1000}s).`}
        actions={
          <>
            <span className="text-xs text-muted-foreground">{filtered.length} rows</span>
            <Button variant="outline" size="sm" onClick={() => void load()}>
              <RefreshCw className="size-4" />
              Refresh
            </Button>
          </>
        }
      />

      {error && (
        <Alert variant="destructive" className="mb-5">
          <AlertTitle>Failed to load logs</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="mb-3.5 flex flex-wrap gap-2.5">
        <Input
          placeholder="Filter by service"
          value={service}
          onChange={(e) => setService(e.target.value)}
          className="max-w-xs"
        />
        <Input
          placeholder="Filter by level"
          value={level}
          onChange={(e) => setLevel(e.target.value)}
          className="max-w-xs"
        />
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="max-h-[calc(100vh-16rem)] overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="sticky top-0 bg-card">Time</TableHead>
                  <TableHead className="sticky top-0 bg-card">Service</TableHead>
                  <TableHead className="sticky top-0 bg-card">Level</TableHead>
                  <TableHead className="sticky top-0 bg-card">Cluster</TableHead>
                  <TableHead className="sticky top-0 bg-card">Score</TableHead>
                  <TableHead className="sticky top-0 bg-card">Message</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground">
                      No logs
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((r, i) => (
                    <TableRow key={i}>
                      <TableCell className="font-mono text-xs whitespace-nowrap">
                        {r.timestamp ?? '—'}
                      </TableCell>
                      <TableCell className="text-sm">{r.service_name ?? '—'}</TableCell>
                      <TableCell className={cn('text-sm', levelClass(r.log_level))}>
                        {r.log_level ?? '—'}
                      </TableCell>
                      <TableCell className="font-mono text-xs">{r.cluster_id || '—'}</TableCell>
                      <TableCell className="font-mono text-xs">
                        {r.anomaly_score != null ? String(r.anomaly_score) : '—'}
                      </TableCell>
                      <TableCell className="max-w-lg truncate font-mono text-xs">
                        {r.message ?? '—'}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
