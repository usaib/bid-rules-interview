import { useEffect, useState } from 'react';
import type { CampaignListResponse, SortKey, SortOrder } from '@bidrules/shared';
import { getCampaigns } from '../api';
import { formatAcos, formatCents } from '../format';

const COLUMNS: Array<{ key: SortKey; label: string; numeric?: boolean }> = [
  { key: 'name', label: 'Campaign' },
  { key: 'spendCents', label: 'Spend', numeric: true },
  { key: 'salesCents', label: 'Sales', numeric: true },
  { key: 'acos', label: 'ACoS', numeric: true },
];

export function CampaignsPage() {
  const [sort, setSort] = useState<SortKey>('name');
  const [order, setOrder] = useState<SortOrder>('asc');
  const [data, setData] = useState<CampaignListResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getCampaigns(sort, order)
      .then((res) => !cancelled && setData(res))
      .catch((err: Error) => !cancelled && setError(err.message));
    return () => {
      cancelled = true;
    };
  }, [sort, order]);

  function toggleSort(key: SortKey) {
    if (key === sort) setOrder(order === 'asc' ? 'desc' : 'asc');
    else {
      setSort(key);
      setOrder(key === 'name' ? 'asc' : 'desc');
    }
  }

  return (
    <section>
      <div className="page-head">
        <div>
          <h2>Campaigns</h2>
          {data && (
            <p className="muted">
              Last 7 days · {data.window.from} to {data.window.to}
            </p>
          )}
        </div>
        {data && (
          <p className="muted">
            {data.campaigns.length} campaign{data.campaigns.length === 1 ? '' : 's'}
          </p>
        )}
      </div>
      {error && <p role="alert">{error}</p>}
      {!data && !error && <p className="muted">Loading…</p>}
      {data && (
        <div className="table-wrap">
          <table aria-label="Campaigns">
            <thead>
              <tr>
                {COLUMNS.map((c) => (
                  <th
                    key={c.key}
                    className={c.numeric ? 'num' : undefined}
                    aria-sort={sort === c.key ? (order === 'asc' ? 'ascending' : 'descending') : undefined}
                  >
                    <button onClick={() => toggleSort(c.key)}>
                      {c.label}
                      {sort === c.key ? (order === 'asc' ? ' ▲' : ' ▼') : ''}
                    </button>
                  </th>
                ))}
                <th className="num">Clicks</th>
                <th className="num">Daily budget</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {data.campaigns.map((c) => (
                <tr key={c.id}>
                  <td>{c.name}</td>
                  <td className="num">{formatCents(c.spendCents)}</td>
                  <td className="num">{formatCents(c.salesCents)}</td>
                  <td className="num">{formatAcos(c.acos)}</td>
                  <td className="num">{c.clicks.toLocaleString('en-US')}</td>
                  <td className="num">{formatCents(c.dailyBudgetCents)}</td>
                  <td>
                    <span className={`status status-${c.status}`}>{c.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
