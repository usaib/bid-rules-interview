import type { PreviewResponse, Rule } from '@bidrules/shared';
import { HttpError } from '../errors';

/**
 * Compute the bid changes a rule WOULD make right now, without writing anything.
 * See docs/SPEC.md §2 for the exact rules.
 */
export async function previewRule(rule: Rule): Promise<PreviewResponse> {
  // TODO(candidate): implement.
  throw new HttpError(501, 'NOT_IMPLEMENTED', `Preview for rule ${rule.id} is not implemented yet`);
}
