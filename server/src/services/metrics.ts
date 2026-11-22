import type { Campaign, CampaignSummary, DailyMetric } from '@bidrules/shared';

export interface Totals {
  clicks: number;
  spendCents: number;
  salesCents: number;
}

export function sumMetrics(metrics: DailyMetric[]): Totals {
  return metrics.reduce<Totals>(
    (t, m) => ({
      clicks: t.clicks + m.clicks,
      spendCents: t.spendCents + m.spendCents,
      salesCents: t.salesCents + m.salesCents,
    }),
    { clicks: 0, spendCents: 0, salesCents: 0 },
  );
}

/** Cost ratio = ad spend / ad sales. `null` when there are no sales. */
export function costRatioOf(totals: Pick<Totals, 'spendCents' | 'salesCents'>): number | null {
  return totals.salesCents > 0 ? totals.spendCents / totals.salesCents : null;
}

export function summarizeCampaign(campaign: Campaign, metrics: DailyMetric[]): CampaignSummary {
  const totals = sumMetrics(metrics);

  const byDay = new Map<string, DailyMetric[]>();
  for (const m of metrics) {
    byDay.set(m.date, [...(byDay.get(m.date) ?? []), m]);
  }
  const dailyAcos = [...byDay.values()]
    .map((day) => costRatioOf(sumMetrics(day)))
    .filter((v): v is number => v !== null);
  const costRatio = dailyAcos.length > 0 ? dailyAcos.reduce((a, b) => a + b, 0) / dailyAcos.length : null;

  return {
    id: campaign.id,
    name: campaign.name,
    status: campaign.status,
    dailyBudgetCents: campaign.dailyBudgetCents,
    ...totals,
    costRatio,
  };
}
