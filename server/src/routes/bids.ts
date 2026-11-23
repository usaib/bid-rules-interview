import { Router } from 'express';
import { HttpError } from '../errors';

export const bidsRouter = Router();

/** PATCH /api/keywords/:id — set one keyword's bid by hand. See docs/SPEC.md §9. */
bidsRouter.patch('/:id', async (_req, _res) => {
  // TODO(candidate): implement. You may add files under src/services/.
  throw new HttpError(501, 'NOT_IMPLEMENTED', 'PATCH /api/keywords/:id is not implemented yet');
});
