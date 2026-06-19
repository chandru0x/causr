import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { anomalySeverity, formatAnomalyScore } from '@/utils/anomaly';

interface AnomalyScoreBadgeProps {
  score: number;
}

export function AnomalyScoreBadge({ score }: AnomalyScoreBadgeProps) {
  const severity = anomalySeverity(score);
  return (
    <Badge
      variant={severity === 'critical' ? 'destructive' : 'secondary'}
      className={cn(
        'font-mono tabular-nums',
        severity === 'warning' && 'bg-amber-500/15 text-amber-700 dark:text-amber-400',
        severity === 'normal' && 'bg-muted text-muted-foreground',
      )}
    >
      {formatAnomalyScore(score)}
    </Badge>
  );
}
