import type { Campaign, DailyMetric, Keyword, Rule } from '@bidrules/shared';

export const campaign = (o: Partial<Campaign> = {}): Campaign => ({
  id: 'c1',
  name: 'Campaign 1',
  status: 'enabled',
  dailyBudgetCents: 5000,
  ...o,
});

export const keyword = (o: Partial<Keyword> = {}): Keyword => ({
  id: 'k1',
  campaignId: 'c1',
  text: 'keyword',
  matchType: 'exact',
  status: 'enabled',
  bidCents: 100,
  version: 1,
  ...o,
});

export const metric = (o: Partial<DailyMetric> & Pick<DailyMetric, 'keywordId' | 'date'>): DailyMetric => ({
  impressions: 100,
  clicks: 0,
  spendCents: 0,
  salesCents: 0,
  orders: 0,
  reportedAt: '2026-11-20T10:00:00Z',
  ...o,
});

export const rule = (o: Partial<Rule> = {}): Rule => ({
  id: 'r1',
  name: 'Rule 1',
  campaignId: 'c1',
  lookbackDays: 7,
  minClicks: 10,
  acosAbove: 0.3,
  bidChangePct: -10,
  minBidCents: 5,
  maxBidCents: 500,
  ...o,
});
