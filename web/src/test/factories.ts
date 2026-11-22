import type { BidChange, CampaignSummary, PreviewResponse, Rule } from '@bidrules/shared';

export const ruleFixture = (o: Partial<Rule> = {}): Rule => ({
  id: 'r1',
  name: 'Cut high-ACoS bids',
  campaignId: 'c1',
  lookbackDays: 7,
  minClicks: 10,
  acosAbove: 0.3,
  bidChangePct: -10,
  minBidCents: 5,
  maxBidCents: 500,
  ...o,
});

export const changeFixture = (o: Partial<BidChange> = {}): BidChange => ({
  keywordId: 'k1',
  keywordText: 'gift for dad',
  version: 1,
  clicks: 30,
  spendCents: 1500,
  salesCents: 3000,
  acos: 0.5,
  currentBidCents: 100,
  newBidCents: 90,
  ...o,
});

export const previewFixture = (changes: BidChange[], ruleId = 'r1'): PreviewResponse => ({
  ruleId,
  window: { from: '2026-11-13', to: '2026-11-19' },
  changes,
});

export const campaignFixture = (o: Partial<CampaignSummary> = {}): CampaignSummary => ({
  id: 'c1',
  name: 'Holiday Gifts - SP',
  status: 'enabled',
  dailyBudgetCents: 5000,
  clicks: 120,
  spendCents: 4567,
  salesCents: 12000,
  acos: 0.380583,
  ...o,
});
