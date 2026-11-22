import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp } from '../src/app';
import { loadSeed } from '../src/db';

describe('smoke', () => {
  it('serves /api/health', async () => {
    const res = await request(createApp()).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: true });
  });

  it('serves seeded rules', async () => {
    loadSeed();
    const res = await request(createApp()).get('/api/rules');
    expect(res.status).toBe(200);
    expect(res.body.rules.length).toBeGreaterThan(0);
  });
});
