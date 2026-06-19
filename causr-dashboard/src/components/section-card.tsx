import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import type { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export type SectionAccent = 'teal' | 'red' | 'amber';

const ACCENT_CLASSES: Record<SectionAccent, string> = {
  teal: 'border-l-teal-500',
  red: 'border-l-red-500',
  amber: 'border-l-amber-500',
};

interface SectionCardProps {
  title: string;
  accent: SectionAccent;
  viewAllHref?: string;
  children: ReactNode;
  contentClassName?: string;
}

export function SectionCard({
  title,
  accent,
  viewAllHref,
  children,
  contentClassName,
}: SectionCardProps) {
  return (
    <Card className={cn('border-l-4', ACCENT_CLASSES[accent])}>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">{title}</CardTitle>
        {viewAllHref && (
          <Button variant="ghost" size="sm" asChild>
            <Link to={viewAllHref}>
              View all
              <ArrowRight className="size-4" />
            </Link>
          </Button>
        )}
      </CardHeader>
      <CardContent className={cn('p-0', contentClassName)}>{children}</CardContent>
    </Card>
  );
}
