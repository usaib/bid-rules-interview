import type { Rule } from '@bidrules/shared';

const usd = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

/** 1234 -> "$12.34" */
export function formatCents(cents: number): string {
  return usd.format(cents / 100);
}

/** 0.4567 -> "45.7%", null -> "—" */
export function formatAcos(acos: number | null): string {
  return acos === null ? '—' : `${(acos * 100).toFixed(1)}%`;
}

/** One-line, human-readable summary of a rule's conditions. */
export function describeRule(rule: Rule): string {
  const change = rule.bidChangePct > 0 ? `+${rule.bidChangePct}%` : `${rule.bidChangePct}%`;
  return (
    `Last ${rule.lookbackDays} days · at least ${rule.minClicks} clicks · ACoS above ${formatAcos(rule.acosAbove)}` +
    ` · change bid ${change}, kept between ${formatCents(rule.minBidCents)} and ${formatCents(rule.maxBidCents)}`
  );
}
