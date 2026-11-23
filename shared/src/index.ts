/**
 * Shared API contract between server and web.
 *
 * This file is the source of truth for request/response shapes.
 * Only types live here (no runtime code) — import with `import type`.
 *
 * Money is ALWAYS integer cents (see docs/CONVENTIONS.md).
 * Dates are marketplace-local calendar days formatted `YYYY-MM-DD`.
 */

export type Status = 'enabled' | 'paused';
export type MatchType = 'exact' | 'phrase' | 'broad';

export interface Campaign {
  id: string;
  name: string;
  status: Status;
  dailyBudgetCents: number;
}

export interface Keyword {
  id: string;
  campaignId: string;
  text: string;
  matchType: MatchType;
  status: Status;
  bidCents: number;
  /** Incremented on every write. Used for optimistic concurrency. */
  version: number;
}

export interface DailyMetric {
  keywordId: string;
  /** Marketplace-local day, `YYYY-MM-DD`. */
  date: string;
  impressions: number;
  clicks: number;
  spendCents: number;
  salesCents: number;
  orders: number;
  /**
   * When the ad platform produced this row (ISO instant). The platform sends corrected numbers for recent
   * days as late sales come in, so a keyword can have several rows for the same date. Only the row with
   * the latest `reportedAt` counts; older rows for that keyword and date are out of date.
   */
  reportedAt: string;
}

export interface Rule {
  id: string;
  name: string;
  campaignId: string;
  /** Number of full marketplace days to look back. Today is never included. */
  lookbackDays: number;
  /** Keyword must have at least this many clicks in the window. */
  minClicks: number;
  /** Threshold as a ratio (0.3 = 30%). A keyword matches when its cost ratio is strictly greater. */
  costRatioAbove: number;
  /** Percentage change to apply to the bid, e.g. -10 means "decrease by 10%". */
  bidChangePct: number;
  minBidCents: number;
  maxBidCents: number;
}

/** Inclusive date range, both ends `YYYY-MM-DD`. */
export interface DateWindow {
  from: string;
  to: string;
}

export type SortKey = 'name' | 'spendCents' | 'salesCents' | 'costRatio';
export type SortOrder = 'asc' | 'desc';

/* ---------- GET /api/campaigns ---------- */

export interface CampaignSummary {
  id: string;
  name: string;
  status: Status;
  dailyBudgetCents: number;
  clicks: number;
  spendCents: number;
  salesCents: number;
  /** spend / sales for the window, or null when sales are 0. */
  costRatio: number | null;
}

export interface CampaignListResponse {
  window: DateWindow;
  campaigns: CampaignSummary[];
}

/* ---------- GET /api/campaigns/:id/keywords ---------- */

export interface KeywordWithMetrics extends Keyword {
  clicks: number;
  spendCents: number;
  salesCents: number;
  costRatio: number | null;
}

export interface KeywordListResponse {
  window: DateWindow;
  keywords: KeywordWithMetrics[];
}

/* ---------- GET /api/rules ---------- */

export interface RuleListResponse {
  rules: Rule[];
}

/* ---------- POST /api/rules ---------- */

/** Everything in a Rule except `id`, which the server assigns. Response: `201` with the created `Rule`. */
export type CreateRuleRequest = Omit<Rule, 'id'>;

/* ---------- POST /api/rules/:id/preview ---------- */

export interface BidChange {
  keywordId: string;
  keywordText: string;
  /** Keyword version the preview was computed from. Send it back in ApplyRequest. */
  version: number;
  clicks: number;
  spendCents: number;
  salesCents: number;
  costRatio: number | null;
  currentBidCents: number;
  newBidCents: number;
}

export interface PreviewResponse {
  ruleId: string;
  window: DateWindow;
  changes: BidChange[];
}

/* ---------- POST /api/rules/:id/apply ---------- */

export interface ApplyRequest {
  /** keywordId -> version, taken from the preview the user approved. */
  expectedVersions: Record<string, number>;
}

export interface AppliedChange {
  keywordId: string;
  previousBidCents: number;
  newBidCents: number;
  newVersion: number;
}

export interface ApplyResponse {
  ruleId: string;
  applied: AppliedChange[];
}

/* ---------- PATCH /api/campaigns/:id ---------- */

/** Pause or resume a campaign. Response: `200` with the updated `Campaign`. */
export interface UpdateCampaignRequest {
  status: Status;
}

/* ---------- PATCH /api/keywords/:id ---------- */

/** Set one keyword's bid by hand. Response: `200` with the updated `Keyword`. */
export interface UpdateBidRequest {
  bidCents: number;
  /** The keyword version the user saw. A different current version is a `409 VERSION_CONFLICT`. */
  expectedVersion: number;
}

/* ---------- Errors ---------- */

export type ErrorCode =
  | 'NOT_FOUND'
  | 'VALIDATION_ERROR'
  | 'VERSION_CONFLICT'
  | 'NOT_IMPLEMENTED'
  | 'INTERNAL';

export interface ApiErrorBody {
  error: {
    code: ErrorCode;
    message: string;
    /** Only on `VALIDATION_ERROR`: one message per invalid request field, keyed by field name. */
    fields?: Record<string, string>;
  };
}
