export type IndexSource = 'git' | 'local';

export interface ServiceRow {
  id: string | null;
  serviceName: string;
  indexSource: IndexSource;
  repoUrl: string | null;
  branch: string;
  localPath: string | null;
  repoSubpath: string | null;
  status: string;
  indexedAt: string | null;
  indexStats: Record<string, unknown>;
  lastIndexJobId: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  discovered: boolean;
  repositoryLinked: boolean;
  codeSourceLinked: boolean;
  clonePath: string | null;
  indexPath: string | null;
  indexed: boolean;
}

export interface UpdateServicePayload {
  indexSource: IndexSource;
  repoUrl?: string;
  branch?: string;
  localPath?: string;
  repoSubpath?: string;
}

export interface InvestigatePayload {
  query?: string;
  context?: Record<string, unknown>;
}

export interface InvestigateResult {
  summary: string;
  details: string;
  metadata: Record<string, unknown>;
}
