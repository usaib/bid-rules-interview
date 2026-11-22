/**
 * Typed API client. All network calls from the UI go through here.
 * Components should never call `fetch` directly.
 */
import type {
  ApplyRequest,
  ApplyResponse,
  CampaignListResponse,
  CreateRuleRequest,
  ErrorCode,
  KeywordListResponse,
  PreviewResponse,
  Rule,
  RuleListResponse,
  SortKey,
  SortOrder,
} from '@bidrules/shared';

export class ApiError extends Error {
  constructor(
    /** HTTP status, or 0 for network failures. */
    public readonly status: number,
    public readonly code: ErrorCode | 'NETWORK',
    message: string,
    /** Per-field messages on `VALIDATION_ERROR`, keyed by request field name. */
    public readonly fields: Record<string, string> = {},
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`/api${path}`, {
      ...init,
      headers: { 'Content-Type': 'application/json', ...init.headers },
    });
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') throw err;
    throw new ApiError(0, 'NETWORK', 'Network error — is the server running?');
  }
  const body = await res.json().catch(() => null);
  if (!res.ok) {
    throw new ApiError(
      res.status,
      body?.error?.code ?? 'INTERNAL',
      body?.error?.message ?? `Request failed with status ${res.status}`,
      body?.error?.fields ?? {},
    );
  }
  return body as T;
}

export function getCampaigns(sort: SortKey = 'name', order: SortOrder = 'asc') {
  return request<CampaignListResponse>(`/campaigns?sort=${sort}&order=${order}`);
}

export function searchKeywords(campaignId: string, q: string, signal?: AbortSignal) {
  return request<KeywordListResponse>(
    `/campaigns/${encodeURIComponent(campaignId)}/keywords?q=${encodeURIComponent(q)}`,
    { signal },
  );
}

export function getRules() {
  return request<RuleListResponse>('/rules');
}

export function createRule(body: CreateRuleRequest) {
  return request<Rule>('/rules', { method: 'POST', body: JSON.stringify(body) });
}

export function previewRule(ruleId: string) {
  return request<PreviewResponse>(`/rules/${encodeURIComponent(ruleId)}/preview`, { method: 'POST' });
}

export function applyRule(ruleId: string, body: ApplyRequest, idempotencyKey: string) {
  return request<ApplyResponse>(`/rules/${encodeURIComponent(ruleId)}/apply`, {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Idempotency-Key': idempotencyKey },
  });
}

export function newIdempotencyKey(): string {
  return crypto.randomUUID();
}
