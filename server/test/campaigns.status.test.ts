import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import { createApp } from '../src/app';
import { loadDataset } from '../src/db';
import { campaign } from './fixtures';

const app = createApp();

describe('PATCH /api/campaigns/:id', () => {
  beforeEach(() => loadDataset({ campaigns: [campaign({ id: 'c1', status: 'enabled' })] }));

  it('pauses a campaign', async () => {
    const res = await request(app).patch('/api/campaigns/c1').send({ status: 'paused' });

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ id: 'c1', status: 'paused' });
  });
});
