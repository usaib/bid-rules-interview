/**
 * In-memory database.
 *
 * Behaves like a real async datastore:
 *  - every call is async and yields to the event loop (like network I/O),
 *  - every call counts as one query (see `db.stats`),
 *  - returned objects are copies — mutating them does NOT change stored data.
 *
 * Do not reach into `state` directly from routes/services; go through `db`.
 */
import type { Campaign, DailyMetric, DateWindow, Keyword, Rule } from '@bidrules/shared';
import { buildSeed } from './seed';

export interface Dataset {
  campaigns: Campaign[];
  keywords: Keyword[];
  metrics: DailyMetric[];
  rules: Rule[];
}

let state: Dataset = { campaigns: [], keywords: [], metrics: [], rules: [] };
let idempotencyRecords = new Map<string, unknown>();
let auditRecords: unknown[] = [];
let queryCount = 0;

const io = () => new Promise<void>((resolve) => setImmediate(resolve));

async function query<T>(read: () => T): Promise<T> {
  queryCount++;
  await io();
  return structuredClone(read());
}

const inWindow = (m: DailyMetric, w: DateWindow) => m.date >= w.from && m.date <= w.to;

export const db = {
  campaigns: {
    findAll: () => query(() => state.campaigns),
    findById: (id: string) => query(() => state.campaigns.find((c) => c.id === id) ?? null),
  },

  keywords: {
    findById: (id: string) => query(() => state.keywords.find((k) => k.id === id) ?? null),
    findByIds: (ids: string[]) => query(() => state.keywords.filter((k) => ids.includes(k.id))),
    findByCampaign: (campaignId: string) =>
      query(() => state.keywords.filter((k) => k.campaignId === campaignId)),

    /** Writes a keyword. `version` is incremented automatically. Returns the updated keyword. */
    async update(id: string, patch: Partial<Pick<Keyword, 'bidCents' | 'status'>>): Promise<Keyword> {
      queryCount++;
      await io();
      const keyword = state.keywords.find((k) => k.id === id);
      if (!keyword) throw new Error(`Keyword ${id} does not exist`);
      Object.assign(keyword, patch, { version: keyword.version + 1 });
      return structuredClone(keyword);
    },
  },

  metrics: {
    findByKeyword: (keywordId: string, window: DateWindow) =>
      query(() => state.metrics.filter((m) => m.keywordId === keywordId && inWindow(m, window))),
    findByKeywords: (keywordIds: string[], window: DateWindow) => {
      const ids = new Set(keywordIds);
      return query(() => state.metrics.filter((m) => ids.has(m.keywordId) && inWindow(m, window)));
    },
    findByCampaign: (campaignId: string, window: DateWindow) => {
      return query(() => {
        const ids = new Set(state.keywords.filter((k) => k.campaignId === campaignId).map((k) => k.id));
        return state.metrics.filter((m) => ids.has(m.keywordId) && inWindow(m, window));
      });
    },
  },

  rules: {
    findAll: () => query(() => state.rules),
    findById: (id: string) => query(() => state.rules.find((r) => r.id === id) ?? null),
    /** Stores a new rule. The caller picks a unique `id`. */
    async insert(rule: Rule): Promise<Rule> {
      queryCount++;
      await io();
      if (state.rules.some((r) => r.id === rule.id)) throw new Error(`Rule ${rule.id} already exists`);
      state.rules.push(structuredClone(rule));
      return structuredClone(rule);
    },
  },

  /** Durable key-value store for idempotency records. Values must be JSON-serialisable. */
  idempotency: {
    get: <T = unknown>(key: string) => query(() => (idempotencyRecords.get(key) as T | undefined) ?? null),
    async put(key: string, value: unknown): Promise<void> {
      queryCount++;
      await io();
      idempotencyRecords.set(key, structuredClone(value));
    },
  },

  /** Append-only audit store. Values must be JSON-serialisable. Not used by the app yet. */
  audit: {
    async append(records: unknown[]): Promise<void> {
      queryCount++;
      await io();
      auditRecords.push(...structuredClone(records));
    },
    list: <T = unknown>() => query(() => auditRecords as T[]),
  },

  stats: {
    get queryCount() {
      return queryCount;
    },
    resetQueryCount() {
      queryCount = 0;
    },
  },
};

/** Replace all data (used by tests). Missing collections become empty. */
export function loadDataset(data: Partial<Dataset>): void {
  state = structuredClone({
    campaigns: data.campaigns ?? [],
    keywords: data.keywords ?? [],
    metrics: data.metrics ?? [],
    rules: data.rules ?? [],
  });
  idempotencyRecords = new Map();
  auditRecords = [];
  queryCount = 0;
}

/** Load the demo dataset used by `npm run dev`. */
export function loadSeed(): void {
  loadDataset(buildSeed());
}
