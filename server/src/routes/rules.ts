import { Router } from 'express';
import type { RuleListResponse } from '@bidrules/shared';
import { db } from '../db';
import { HttpError, notFound } from '../errors';
import { previewRule } from '../services/rulesEngine';

export const rulesRouter = Router();

/** GET /api/rules */
rulesRouter.get('/', async (_req, res) => {
  const body: RuleListResponse = { rules: await db.rules.findAll() };
  res.json(body);
});

/** POST /api/rules — create a rule. See docs/SPEC.md §6. */
rulesRouter.post('/', async (_req, _res) => {
  // TODO(candidate): implement.
  throw new HttpError(501, 'NOT_IMPLEMENTED', 'POST /api/rules is not implemented yet');
});

/** POST /api/rules/:id/preview — see docs/SPEC.md §2. */
rulesRouter.post('/:id/preview', async (req, res) => {
  const rule = await db.rules.findById(req.params.id);
  if (!rule) throw notFound('Rule');
  res.json(await previewRule(rule));
});

/** POST /api/rules/:id/apply — see docs/SPEC.md §3. */
rulesRouter.post('/:id/apply', async (_req, _res) => {
  // TODO(candidate): implement. You may add files under src/services/.
  throw new HttpError(501, 'NOT_IMPLEMENTED', 'POST /api/rules/:id/apply is not implemented yet');
});
