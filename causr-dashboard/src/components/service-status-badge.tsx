import { Badge } from '@/components/ui/badge';
import { serviceStatusLabel } from '@/api/services';
import { cn } from '@/lib/utils';

interface ServiceStatusBadgeProps {
  status: string;
}

export function ServiceStatusBadge({ status }: ServiceStatusBadgeProps) {
  const label = serviceStatusLabel(status);
  return (
    <Badge
      variant="secondary"
      className={cn(
        status === 'indexed' && 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400',
        status === 'indexing' && 'bg-blue-500/15 text-blue-700 dark:text-blue-400',
        status === 'failed' && 'bg-destructive/15 text-destructive',
        status === 'discovered' && 'bg-muted text-muted-foreground',
      )}
    >
      {label}
    </Badge>
  );
}
