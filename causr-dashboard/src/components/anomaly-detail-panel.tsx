import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { AnomalyInvestigateActions } from '@/components/anomaly-investigate-actions';
import type { AnomalyRow, LogRow } from '@/types/dashboard';
import type { ServiceRow } from '@/types/services';
import { formatWindowRange, parseAnomalyFeatures } from '@/utils/anomaly';
import { cn } from '@/lib/utils';

interface AnomalyDetailPanelProps {
  row: AnomalyRow;
  logs: LogRow[];
  loading: boolean;
  service?: ServiceRow;
}

function levelClass(level?: string): string {
  const l = (level ?? '').toUpperCase();
  if (l === 'ERROR') return 'text-destructive';
  if (l === 'WARN' || l === 'WARNING') return 'text-amber-600 dark:text-amber-400';
  return '';
}

export function AnomalyDetailPanel({ row, logs, loading, service }: AnomalyDetailPanelProps) {
  const features = parseAnomalyFeatures(row.feature_json);

  return (
    <div className="space-y-5 border-t bg-muted/30 p-3.5">
      <dl className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Window', value: formatWindowRange(row.window_start, row.window_end) },
          { label: 'Detected', value: row.created_at ?? '—' },
          { label: 'Tenant', value: row.tenant_id ?? '—' },
          { label: 'ID', value: row.id ?? '—' },
        ].map(({ label, value }) => (
          <div key={label}>
            <dt className="text-xs font-medium text-muted-foreground">{label}</dt>
            <dd className="mt-1 font-mono text-sm break-all">{value}</dd>
          </div>
        ))}
      </dl>

      {features && (
        <div>
          <p className="mb-2 text-xs font-medium text-muted-foreground">Window metrics</p>
          <div className="flex flex-wrap gap-3 font-mono text-sm">
            {features.error_rate != null && (
              <span>error rate {(features.error_rate * 100).toFixed(1)}%</span>
            )}
            {features.log_volume != null && <span>volume {features.log_volume}</span>}
            {features.p99_latency_ms != null && (
              <span>p99 {features.p99_latency_ms.toFixed(0)} ms</span>
            )}
            {features.unique_error_types != null && (
              <span>error types {features.unique_error_types}</span>
            )}
            {features.new_error_types != null && (
              <span>new types {features.new_error_types}</span>
            )}
          </div>
        </div>
      )}

      <div>
        <p className="mb-2 text-xs font-medium text-muted-foreground">Andromedia</p>
        <AnomalyInvestigateActions anomaly={row} service={service} />
      </div>

      <div>
        <p className="mb-2 text-xs font-medium text-muted-foreground">RCA</p>
        <pre className="max-h-40 overflow-auto rounded-lg border bg-background p-3 text-sm whitespace-pre-wrap">
          {row.rca_text?.trim() ? row.rca_text : '(no RCA yet)'}
        </pre>
      </div>

      <div>
        <p className="mb-2 text-xs font-medium text-muted-foreground">Logs in window</p>
        {loading ? (
          <div className="space-y-2">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
          </div>
        ) : (
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Time</TableHead>
                  <TableHead>Level</TableHead>
                  <TableHead>Message</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-muted-foreground">
                      No logs in this anomaly window
                    </TableCell>
                  </TableRow>
                ) : (
                  logs.map((log, i) => (
                    <TableRow key={i}>
                      <TableCell className="font-mono text-xs whitespace-nowrap">
                        {log.timestamp ?? '—'}
                      </TableCell>
                      <TableCell className={cn('text-xs', levelClass(log.log_level))}>
                        {log.log_level ?? '—'}
                      </TableCell>
                      <TableCell className="max-w-md truncate font-mono text-xs">
                        {log.message ?? '—'}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
}
