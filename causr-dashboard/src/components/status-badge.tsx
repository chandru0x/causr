import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface StatusBadgeProps {
  status: string;
}

function normalize(status: string): string {
  return status.toUpperCase();
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const value = normalize(status);
  const variant =
    value === 'GREEN' || value === 'HEALTHY'
      ? 'default'
      : value === 'RED' || value === 'CRITICAL'
        ? 'destructive'
        : 'secondary';

  return (
    <Badge
      variant={variant}
      className={cn(
        value === 'GREEN' && 'bg-emerald-600/15 text-emerald-700 dark:text-emerald-400',
        value === 'AMBER' && 'bg-amber-500/15 text-amber-700 dark:text-amber-400',
      )}
    >
      {status}
    </Badge>
  );
}
