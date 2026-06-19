import { BFF_API_BASE } from '../config';
import type {
  InvestigatePayload,
  InvestigateResult,
  ServiceRow,
  UpdateServicePayload,
} from '../types/services';

async function servicesRequest<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const res = await fetch(`${BFF_API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...init?.headers },
    ...init,
  });
  if (!res.ok) {
    throw new Error(`Services request failed: ${res.status} ${res.statusText}`);
  }
  return (await res.json()) as T;
}

export async function fetchServices(): Promise<ServiceRow[]> {
  return servicesRequest<ServiceRow[]>('/api/services');
}

export async function fetchService(serviceName: string): Promise<ServiceRow> {
  return servicesRequest<ServiceRow>(`/api/services/${encodeURIComponent(serviceName)}`);
}

export async function saveServiceCodeSource(
  serviceName: string,
  payload: UpdateServicePayload,
): Promise<ServiceRow> {
  return servicesRequest<ServiceRow>(`/api/services/${encodeURIComponent(serviceName)}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export async function reindexService(serviceName: string): Promise<ServiceRow> {
  return servicesRequest<ServiceRow>(
    `/api/services/${encodeURIComponent(serviceName)}/reindex`,
    { method: 'POST' },
  );
}

export async function investigateService(
  serviceName: string,
  payload: InvestigatePayload,
): Promise<InvestigateResult> {
  return servicesRequest<InvestigateResult>(
    `/api/services/${encodeURIComponent(serviceName)}/investigate`,
    {
      method: 'POST',
      body: JSON.stringify(payload),
    },
  );
}

export function serviceStatusLabel(status: string): string {
  switch (status) {
    case 'discovered':
      return 'Not Linked';
    case 'linking':
      return 'Linking';
    case 'indexing':
      return 'Indexing…';
    case 'indexed':
      return 'Indexed';
    case 'failed':
      return 'Failed';
    default:
      return status;
  }
}

export function codeSourceLabel(row: ServiceRow): string {
  if (!row.codeSourceLinked) {
    return 'Not Linked';
  }
  if (row.indexSource === 'local') {
    return row.localPath ?? 'Local path';
  }
  const parts = [row.repoUrl ?? 'Repository'];
  if (row.repoSubpath) {
    parts.push(`/${row.repoSubpath}`);
  }
  parts.push(` · branch ${row.branch}`);
  return parts.join('');
}
