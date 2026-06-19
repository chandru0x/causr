import type { ReactNode } from 'react';
import { Loader2, Search } from 'lucide-react';
import Markdown from 'react-markdown';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { InvestigateResult } from '@/types/services';
import { parseInvestigationDetails, scoreBadgeVariant } from '@/utils/investigation';
import { cn } from '@/lib/utils';

interface InvestigationResultPanelProps {
  result: InvestigateResult | null;
  loading?: boolean;
  compact?: boolean;
}

const markdownComponents = {
  p: ({ children }: { children?: ReactNode }) => (
    <p className="mb-3 text-sm leading-relaxed last:mb-0">{children}</p>
  ),
  strong: ({ children }: { children?: ReactNode }) => (
    <strong className="font-semibold text-foreground">{children}</strong>
  ),
  ol: ({ children }: { children?: ReactNode }) => (
    <ol className="mb-3 list-decimal space-y-1.5 pl-5 text-sm last:mb-0">{children}</ol>
  ),
  ul: ({ children }: { children?: ReactNode }) => (
    <ul className="mb-3 list-disc space-y-1.5 pl-5 text-sm last:mb-0">{children}</ul>
  ),
  li: ({ children }: { children?: ReactNode }) => (
    <li className="leading-relaxed text-muted-foreground">{children}</li>
  ),
  h1: ({ children }: { children?: ReactNode }) => (
    <h3 className="mb-2 text-sm font-semibold">{children}</h3>
  ),
  h2: ({ children }: { children?: ReactNode }) => (
    <h3 className="mb-2 text-sm font-semibold">{children}</h3>
  ),
  h3: ({ children }: { children?: ReactNode }) => (
    <h3 className="mb-2 text-sm font-semibold">{children}</h3>
  ),
};

function InvestigationLoading({ compact }: { compact?: boolean }) {
  return (
    <Card className={cn('border-l-4 border-l-violet-500', compact && 'shadow-none')}>
      <CardContent className={cn('space-y-3', compact ? 'py-4' : 'py-6')}>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" />
          Searching codebase and generating analysis…
        </div>
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-4 w-4/6" />
      </CardContent>
    </Card>
  );
}

export function InvestigationResultPanel({
  result,
  loading,
  compact,
}: InvestigationResultPanelProps) {
  if (loading) {
    return <InvestigationLoading compact={compact} />;
  }

  if (!result) {
    return null;
  }

  const sections = parseInvestigationDetails(result.details);
  const referenceCount =
    typeof result.metadata?.referenceCount === 'number'
      ? result.metadata.referenceCount
      : null;
  const indexPath =
    typeof result.metadata?.indexPath === 'string' ? result.metadata.indexPath : null;

  return (
    <div className={cn('space-y-4', compact && 'space-y-3')}>
      {result.summary && (
        <Card className={cn('border-l-4 border-l-violet-500', compact && 'shadow-none')}>
          <CardHeader className={cn(compact && 'px-4 py-3')}>
            <CardTitle className="text-base">Root cause analysis</CardTitle>
          </CardHeader>
          <CardContent className={cn(compact && 'px-4 pb-4')}>
            <div className="investigation-markdown text-foreground">
              <Markdown components={markdownComponents}>{result.summary}</Markdown>
            </div>
          </CardContent>
        </Card>
      )}

      {sections.map((section, index) => {
        if (section.kind === 'searchHits') {
          return (
            <Card key={`hits-${index}`} className={cn(compact && 'shadow-none')}>
              <CardHeader className={cn('flex flex-row items-center gap-2', compact && 'px-4 py-3')}>
                <Search className="size-4 text-muted-foreground" />
                <CardTitle className="text-sm font-medium">Hybrid search hits</CardTitle>
                <Badge variant="outline" className="ml-auto">
                  {section.hits.length}
                </Badge>
              </CardHeader>
              <CardContent className={cn('p-0', compact && 'px-0 pb-0')}>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>File</TableHead>
                      <TableHead>Symbol</TableHead>
                      <TableHead className="text-right">Score</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {section.hits.map((hit, i) => (
                      <TableRow key={`${hit.file}-${i}`}>
                        <TableCell>
                          <Badge variant="outline" className="font-mono text-xs font-normal">
                            {hit.file}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-mono text-xs text-muted-foreground">
                          {hit.symbol}
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge
                            variant={scoreBadgeVariant(hit.score)}
                            className="font-mono tabular-nums"
                          >
                            {hit.score.toFixed(3)}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          );
        }

        return (
          <Card key={`text-${index}`} className={cn(compact && 'shadow-none')}>
            <CardHeader className={cn(compact && 'px-4 py-3')}>
              <CardTitle className="text-sm font-medium">{section.title}</CardTitle>
            </CardHeader>
            <CardContent className={cn(compact && 'px-4 pb-4')}>
              <pre className="max-h-48 overflow-auto whitespace-pre-wrap font-mono text-xs text-muted-foreground">
                {section.body}
              </pre>
            </CardContent>
          </Card>
        );
      })}

      {(referenceCount != null || indexPath) && (
        <p className="text-xs text-muted-foreground">
          {referenceCount != null && `${String(referenceCount)} code references`}
          {referenceCount != null && indexPath && ' · '}
          {indexPath != null && (
            <span className="font-mono">{String(indexPath)}</span>
          )}
        </p>
      )}
    </div>
  );
}
