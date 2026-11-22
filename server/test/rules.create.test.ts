import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import { createApp } from '../src/app';
import { loadDataset } from '../src/db';
import { campaign, rule } from './fixtures';

const app = createApp();

const valid = {
  name: 'Trim expensive keywords',
  campaignId: 'c1',
  lookbackDays: 14,
  minClicks: 25,
  costRatioAbove: 0.4,
  bidChangePct: -20,
  minBidCents: 10,
  maxBidCents: 300,
};

describe('POST /api/rules', () => {
  beforeEach(() => {
    loadDataset({ campaigns: [campaign({ id: 'c1' })], rules: [rule({ id: 'r1', name: 'Existing rule' })] });
  });

  it('creates a rule and lists it', async () => {
    const res = await request(app).post('/api/rules').send(valid);
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject(valid);
    expect(typeof res.body.id).toBe('string');

    const list = await request(app).get('/api/rules');
    expect(list.body.rules.map((r: { name: string }) => r.name)).toEqual(['Existing rule', 'Trim expensive keywords']);
  });

  it('returns a field error for an invalid field', async () => {
    const res = await request(app).post('/api/rules').send({ ...valid, lookbackDays: 0 });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(Object.keys(res.body.error.fields)).toEqual(['lookbackDays']);
  });
});
