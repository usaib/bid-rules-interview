import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import { createApp } from '../src/app';
import { setNowForTests } from '../src/clock';
import { db, loadDataset } from '../src/db';
import { campaign, keyword, metric, rule } from './fixtures';

const app = createApp();

function load() {
  loadDataset({
    campaigns: [campaign({ id: 'c1' })],
    keywords: [keyword({ id: 'k1', bidCents: 200, version: 1 })],
    metrics: [metric({ keywordId: 'k1', date: '2026-11-18', clicks: 50, spendCents: 2000, salesCents: 4000 })],
    rules: [rule({ id: 'r1', campaignId: 'c1', minClicks: 10, acosAbove: 0.3, bidChangePct: -25 })],
  });
}

describe('POST /api/rules/:id/apply', () => {
  beforeEach(() => {
    setNowForTests('2026-11-20T20:00:00Z');
    load();
  });

  it('applies the previewed changes and bumps the keyword version', async () => {
    const res = await request(app)
      .post('/api/rules/r1/apply')
      .set('Idempotency-Key', 'visible-test-1')
      .send({ expectedVersions: { k1: 1 } });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      ruleId: 'r1',
      applied: [{ keywordId: 'k1', previousBidCents: 200, newBidCents: 150, newVersion: 2 }],
    });
    expect(await db.keywords.findById('k1')).toMatchObject({ bidCents: 150, version: 2 });
  });

  it('requires an Idempotency-Key header', async () => {
    const res = await request(app).post('/api/rules/r1/apply').send({ expectedVersions: { k1: 1 } });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });
});
