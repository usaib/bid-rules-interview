import type { DateWindow } from '@bidrules/shared';
import { now } from './clock';

/** All reporting is done in the marketplace's local time (Amazon US). */
export const MARKETPLACE_TZ = 'America/Los_Angeles';

const formatter = new Intl.DateTimeFormat('en-US', {
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

/** Calendar day (YYYY-MM-DD) of `instant` in the marketplace time zone. */
export function marketplaceDate(instant: Date): string {
  const parts = Object.fromEntries(formatter.formatToParts(instant).map((p) => [p.type, p.value]));
  return `${parts.year}-${parts.month}-${parts.day}`;
}

/** Add (or subtract) whole calendar days to a YYYY-MM-DD string. */
export function addDays(ymd: string, days: number): string {
  const [y, m, d] = ymd.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10);
}

/**
 * The `days` full marketplace days before today. Today is excluded because
 * Amazon reports for the current day are incomplete.
 */
export function lookbackWindow(days: number, instant: Date = now()): DateWindow {
  const today = marketplaceDate(instant);
  return { from: addDays(today, -days), to: addDays(today, -1) };
}

export function isInWindow(date: string, window: DateWindow): boolean {
  return date >= window.from && date <= window.to;
}
