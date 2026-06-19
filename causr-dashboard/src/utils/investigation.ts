export interface SearchHitRow {
  file: string;
  symbol: string;
  score: number;
}

export type InvestigationSection =
  | { kind: 'searchHits'; hits: SearchHitRow[] }
  | { kind: 'text'; title: string; body: string };

const SEARCH_HIT_LINE = /^-\s+(.+?)\s+score=([\d.]+)\s*$/;

function parseSearchHitLine(line: string): SearchHitRow | null {
  const match = line.trim().match(SEARCH_HIT_LINE);
  if (!match) {
    return null;
  }
  const rest = match[1].trim();
  const score = Number.parseFloat(match[2]);
  if (Number.isNaN(score)) {
    return null;
  }
  const parts = rest.split(/\s+/);
  const file = parts[0] ?? rest;
  const symbol = parts.length > 1 ? parts.slice(1).join(' ') : file;
  return { file, symbol, score };
}

function parseSearchHitsBlock(block: string): SearchHitRow[] {
  const lines = block.split('\n').slice(1);
  const hits: SearchHitRow[] = [];
  for (const line of lines) {
    const hit = parseSearchHitLine(line);
    if (hit) {
      hits.push(hit);
    }
  }
  return hits;
}

function parseTextBlock(block: string): InvestigationSection | null {
  const trimmed = block.trim();
  if (!trimmed) {
    return null;
  }
  const colonIndex = trimmed.indexOf(':');
  if (colonIndex <= 0) {
    return { kind: 'text', title: 'Details', body: trimmed };
  }
  const title = trimmed.slice(0, colonIndex).trim();
  const body = trimmed.slice(colonIndex + 1).trim();
  return { kind: 'text', title, body };
}

export function parseInvestigationDetails(details: string): InvestigationSection[] {
  if (!details.trim()) {
    return [];
  }
  const blocks = details.split(/\n\n+/);
  const sections: InvestigationSection[] = [];
  for (const block of blocks) {
    const trimmed = block.trim();
    if (!trimmed) {
      continue;
    }
    if (trimmed.startsWith('Hybrid search hits:')) {
      const hits = parseSearchHitsBlock(trimmed);
      if (hits.length > 0) {
        sections.push({ kind: 'searchHits', hits });
      }
      continue;
    }
    const textSection = parseTextBlock(trimmed);
    if (textSection) {
      sections.push(textSection);
    }
  }
  return sections;
}

export function scoreBadgeVariant(score: number): 'default' | 'secondary' {
  return score < 0.015 ? 'secondary' : 'default';
}
