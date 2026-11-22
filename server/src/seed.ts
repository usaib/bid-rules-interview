/**
 * Demo data for `npm run dev`. Deterministic, generated relative to "today"
 * so the dashboard always has the last 30 days of data.
 * Tests never use this — they load their own fixtures.
 */
import type { Campaign, DailyMetric, Keyword, Rule } from '@bidrules/shared';
import type { Dataset } from './db';
import { now } from './clock';
import { addDays, marketplaceDate } from './dates';

function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const CAMPAIGNS: Array<Campaign & { words: string[] }> = [
  { id: 'c1', name: 'Holiday Gifts - SP', status: 'enabled', dailyBudgetCents: 5000,
    words: ['gift for dad', 'christmas gifts', 'stocking stuffers', 'secret santa', 'gift basket', 'ugly sweater', 'advent calendar', 'gifts under 20', 'white elephant gift', 'holiday mug', 'personalized ornament', 'gift wrap'] },
  { id: 'c2', name: 'Kitchen Essentials - Exact', status: 'enabled', dailyBudgetCents: 3000,
    words: ['cast iron skillet', 'chef knife', 'cutting board', 'measuring cups', 'silicone spatula', 'mixing bowls', 'knife sharpener', 'garlic press', 'salad spinner', 'dutch oven'] },
  { id: 'c3', name: 'Brand Defense', status: 'enabled', dailyBudgetCents: 2000,
    words: ['acme home', 'acme kitchen', 'acme cookware', 'acme official', 'acme store'] },
  { id: 'c4', name: 'Clearance - Paused', status: 'paused', dailyBudgetCents: 1000,
    words: ['clearance kitchen', 'discount cookware', 'last season decor'] },
  { id: 'c5', name: 'Back to School', status: 'enabled', dailyBudgetCents: 1500,
    words: ['lunch box', 'water bottle kids', 'pencil case', 'backpack', 'desk organizer', 'label maker'] },
];

const MATCH_TYPES = ['exact', 'phrase', 'broad'] as const;
const CORRECTED = new Set(['c1', 'c2']);

export function buildSeed(): Dataset {
  const rand = mulberry32(42);
  const correctionRand = mulberry32(7); // separate stream so the base data stays stable
  const today = marketplaceDate(now());
  const campaigns: Campaign[] = [];
  const keywords: Keyword[] = [];
  const metrics: DailyMetric[] = [];
  let kwSeq = 1;

  for (const { words, ...campaign } of CAMPAIGNS) {
    campaigns.push(campaign);
    for (const text of words) {
      const id = `k${String(kwSeq++).padStart(3, '0')}`;
      const quality = rand(); // 0 = terrible, 1 = great
      keywords.push({
        id,
        campaignId: campaign.id,
        text,
        matchType: MATCH_TYPES[Math.floor(rand() * 3)],
        status: rand() < 0.1 ? 'paused' : 'enabled',
        bidCents: 20 + Math.floor(rand() * 180),
        version: 1,
      });
      for (let back = 30; back >= 0; back--) {
        const clicks = Math.floor(rand() * 12);
        const cpc = 30 + Math.floor(rand() * 90);
        const converts = rand() < 0.15 + quality * 0.35;
        const orders = converts ? 1 + Math.floor(rand() * 2) : 0;
        const date = addDays(today, -back);
        const row: DailyMetric = {
          keywordId: id,
          date,
          impressions: clicks * (20 + Math.floor(rand() * 60)),
          clicks,
          spendCents: clicks * cpc,
          salesCents: orders * (1500 + Math.floor(rand() * 3500)),
          orders,
          reportedAt: `${addDays(date, 1)}T10:00:00Z`,
        };
        // The ad platform corrects recent days as late sales arrive: the first report undercounts
        // orders, a later one carries the final numbers.
        if (CORRECTED.has(campaign.id) && back >= 3 && orders > 0 && correctionRand() < 0.4) {
          const earlyOrders = orders - 1;
          metrics.push({ ...row, orders: earlyOrders, salesCents: Math.round((row.salesCents * earlyOrders) / orders) });
          row.reportedAt = `${addDays(date, 3)}T10:00:00Z`;
        }
        metrics.push(row);
      }
    }
  }

  const rules: Rule[] = [
    { id: 'r1', name: 'Holiday: cut bids on high-cost keywords', campaignId: 'c1', lookbackDays: 7, minClicks: 20, costRatioAbove: 0.35, bidChangePct: -15, minBidCents: 10, maxBidCents: 400 },
    { id: 'r2', name: 'Kitchen: trim unprofitable keywords', campaignId: 'c2', lookbackDays: 7, minClicks: 15, costRatioAbove: 0.4, bidChangePct: -20, minBidCents: 5, maxBidCents: 300 },
    { id: 'r3', name: 'Holiday: aggressive 14-day cut', campaignId: 'c1', lookbackDays: 14, minClicks: 10, costRatioAbove: 0.25, bidChangePct: -70, minBidCents: 10, maxBidCents: 400 },
    { id: 'r4', name: 'Brand defense: raise bids', campaignId: 'c3', lookbackDays: 7, minClicks: 5, costRatioAbove: 0.05, bidChangePct: 25, minBidCents: 10, maxBidCents: 250 },
    { id: 'r5', name: 'Clearance: cut bids', campaignId: 'c4', lookbackDays: 7, minClicks: 1, costRatioAbove: 0.1, bidChangePct: -10, minBidCents: 5, maxBidCents: 200 },
  ];

  return { campaigns, keywords, metrics, rules };
}
