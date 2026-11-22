import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import { createApp } from '../src/app';
import { setNowForTests } from '../src/clock';
import { loadDataset } from '../src/db';
import { campaign, keyword, metric } from './fixtures';

const app = createApp();

// Noon in Los Angeles on 2026-11-20 → window is 2026-11-13 .. 2026-11-19
const NOW = '2026-11-20T20:00:00Z';

describe('GET /api/campaigns', () => {
  beforeEach(() => setNowForTests(NOW));

  it('returns 7-day totals per campaign, excluding today', async () => {
    loadDataset({
      campaigns: [campaign({ id: 'c1', name: 'Alpha' })],
      keywords: [keyword({ id: 'k1', campaignId: 'c1' })],
      metrics: [
        metric({ keywordId: 'k1', date: '2026-11-12', clicks: 99, spendCents: 9900, salesCents: 0 }), // too old
        metric({ keywordId: 'k1', date: '2026-11-13', clicks: 10, spendCents: 500, salesCents: 2000 }),
        metric({ keywordId: 'k1', date: '2026-11-19', clicks: 5, spendCents: 250, salesCents: 1000 }),
        metric({ keywordId: 'k1', date: '2026-11-20', clicks: 99, spendCents: 9900, salesCents: 0 }), // today
      ],
    });

    const res = await request(app).get('/api/campaigns');

    expect(res.status).toBe(200);
    expect(res.body.window).toEqual({ from: '2026-11-13', to: '2026-11-19' });
    expect(res.body.campaigns).toEqual([
      expect.objectContaining({ id: 'c1', clicks: 15, spendCents: 750, salesCents: 3000, acos: 0.25 }),
    ]);
  });

  it('sorts by name', async () => {
    loadDataset({
      campaigns: [
        campaign({ id: 'c1', name: 'Alpha' }),
        campaign({ id: 'c2', name: 'Bravo' }),
        campaign({ id: 'c3', name: 'Charlie' }),
      ],
    });

    const res = await request(app).get('/api/campaigns?sort=name&order=asc');

    expect(res.body.campaigns.map((c: { name: string }) => c.name)).toEqual(['Alpha', 'Bravo', 'Charlie']);
  });

  // Reproduces support ticket SUP-1432 (see README → "Bug report").
  it('reports the same ACoS as the Amazon console for a multi-day window', async () => {
    loadDataset({
      campaigns: [campaign({ id: 'c1', name: 'Holiday Gifts - SP' })],
      keywords: [keyword({ id: 'k1', campaignId: 'c1' })],
      metrics: [
        metric({ keywordId: 'k1', date: '2026-11-17', clicks: 40, spendCents: 1000, salesCents: 2000 }),
        metric({ keywordId: 'k1', date: '2026-11-18', clicks: 4, spendCents: 100, salesCents: 1000 }),
      ],
    });

    const res = await request(app).get('/api/campaigns');

    // Amazon console: spend $11.00 / sales $30.00 = 36.7%
    expect(res.body.campaigns[0].acos).toBeCloseTo(1100 / 3000, 6);
  });
});
