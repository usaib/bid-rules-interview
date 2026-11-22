import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import { createApp } from '../src/app';
import { setNowForTests } from '../src/clock';
import { loadDataset } from '../src/db';
import { campaign, keyword, metric, rule } from './fixtures';

const app = createApp();

describe('POST /api/rules/:id/preview', () => {
  beforeEach(() => setNowForTests('2026-11-20T20:00:00Z'));

  it('returns 404 in the standard error format for an unknown rule', async () => {
    loadDataset({});
    const res = await request(app).post('/api/rules/nope/preview');
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: { code: 'NOT_FOUND', message: expect.any(String) } });
  });

  it('lowers bids for keywords over the cost ratio threshold and leaves the rest alone', async () => {
    loadDataset({
      campaigns: [campaign({ id: 'c1' })],
      keywords: [
        keyword({ id: 'k1', text: 'bad keyword', bidCents: 100, version: 3 }),
        keyword({ id: 'k2', text: 'good keyword', bidCents: 100 }),
      ],
      metrics: [
        // k1: Cost ratio 50%, 30 clicks → matches
        metric({ keywordId: 'k1', date: '2026-11-18', clicks: 30, spendCents: 1500, salesCents: 3000 }),
        // k2: Cost ratio 10% → does not match
        metric({ keywordId: 'k2', date: '2026-11-18', clicks: 30, spendCents: 300, salesCents: 3000 }),
      ],
      rules: [rule({ id: 'r1', campaignId: 'c1', minClicks: 20, costRatioAbove: 0.3, bidChangePct: -10 })],
    });

    const res = await request(app).post('/api/rules/r1/preview');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      ruleId: 'r1',
      window: { from: '2026-11-13', to: '2026-11-19' },
      changes: [
        {
          keywordId: 'k1',
          keywordText: 'bad keyword',
          version: 3,
          clicks: 30,
          spendCents: 1500,
          salesCents: 3000,
          costRatio: 0.5,
          currentBidCents: 100,
          newBidCents: 90,
        },
      ],
    });
  });
});
