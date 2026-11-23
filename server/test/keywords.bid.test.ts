import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import { createApp } from '../src/app';
import { loadDataset } from '../src/db';
import { campaign, keyword } from './fixtures';

const app = createApp();

describe('PATCH /api/keywords/:id', () => {
  beforeEach(() =>
    loadDataset({ campaigns: [campaign({ id: 'c1' })], keywords: [keyword({ id: 'k1', bidCents: 100, version: 3 })] }),
  );

  it('sets the bid and bumps the version', async () => {
    const res = await request(app).patch('/api/keywords/k1').send({ bidCents: 120, expectedVersion: 3 });

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ id: 'k1', bidCents: 120, version: 4 });
  });
});
