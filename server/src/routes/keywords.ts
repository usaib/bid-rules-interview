import { Router } from 'express';
import { z } from 'zod';
import type { KeywordListResponse, KeywordWithMetrics } from '@bidrules/shared';
import { db } from '../db';
import { lookbackWindow } from '../dates';
import { notFound, validate } from '../errors';
import { costRatioOf, sumMetrics } from '../services/metrics';

export const keywordsRouter = Router({ mergeParams: true });

const listQuery = z.object({ q: z.string().trim().optional() });

/** GET /api/campaigns/:campaignId/keywords?q= — keywords with 7-day metrics. See docs/SPEC.md §4. */
keywordsRouter.get('/', async (req, res) => {
  const { q } = validate(listQuery, req.query);
  const { campaignId } = req.params as { campaignId: string };

  const campaign = await db.campaigns.findById(campaignId);
  if (!campaign) throw notFound('Campaign');

  const window = lookbackWindow(7);
  let keywords = await db.keywords.findByCampaign(campaign.id);
  if (q) {
    const needle = q.toLowerCase();
    keywords = keywords.filter((k) => k.text.toLowerCase().includes(needle));
  }

  const result: KeywordWithMetrics[] = [];
  for (const keyword of keywords) {
    const totals = sumMetrics(await db.metrics.findByKeyword(keyword.id, window));
    result.push({ ...keyword, ...totals, costRatio: costRatioOf(totals) });
  }

  const body: KeywordListResponse = { window, keywords: result };
  res.json(body);
});
