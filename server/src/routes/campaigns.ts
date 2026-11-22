import { Router } from 'express';
import { z } from 'zod';
import type { CampaignListResponse, CampaignSummary } from '@bidrules/shared';
import { db } from '../db';
import { lookbackWindow } from '../dates';
import { validate } from '../errors';
import { summarizeCampaign } from '../services/metrics';
import { sortBy } from '../sort';

export const campaignsRouter = Router();

const listQuery = z.object({
  sort: z.enum(['name', 'spendCents', 'salesCents', 'acos']).default('name'),
  order: z.enum(['asc', 'desc']).default('asc'),
});

/** GET /api/campaigns — 7-day performance per campaign. See docs/SPEC.md §1. */
campaignsRouter.get('/', async (req, res) => {
  const { sort, order } = validate(listQuery, req.query);
  const window = lookbackWindow(7);

  const campaigns = await db.campaigns.findAll();
  const rows: CampaignSummary[] = [];
  for (const campaign of campaigns) {
    const metrics = await db.metrics.findByCampaign(campaign.id, window);
    rows.push(summarizeCampaign(campaign, metrics));
  }

  const body: CampaignListResponse = { window, campaigns: sortBy(rows, sort, order) };
  res.json(body);
});
