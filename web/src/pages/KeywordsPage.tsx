import { useEffect, useState } from 'react';
import type { CampaignSummary, KeywordWithMetrics } from '@bidrules/shared';
import { getCampaigns, searchKeywords } from '../api';
import { formatCents, formatRatio } from '../format';

export function KeywordsPage() {
  const [campaigns, setCampaigns] = useState<CampaignSummary[]>([]);
  const [campaignId, setCampaignId] = useState('');
  const [query, setQuery] = useState('');
  const [keywords, setKeywords] = useState<KeywordWithMetrics[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getCampaigns('name', 'asc')
      .then((res) => {
        setCampaigns(res.campaigns);
        setCampaignId(res.campaigns[0]?.id ?? '');
      })
      .catch((err: Error) => setError(err.message));
  }, []);

  useEffect(() => {
    if (!campaignId) return;
    setError(null);
    searchKeywords(campaignId, query)
      .then((res) => setKeywords(res.keywords))
      .catch((err: Error) => setError(err.message));
  }, [campaignId, query]);

  return (
    <section>
      <div className="page-head">
        <div>
          <h2>Keywords</h2>
          <p className="muted">Last 7 days</p>
        </div>
        <p className="muted">
          {keywords.length} keyword{keywords.length === 1 ? '' : 's'}
        </p>
      </div>
      <div className="toolbar">
        <select value={campaignId} onChange={(e) => setCampaignId(e.target.value)}>
          {campaigns.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <div className="search">
          <input
            type="search"
            placeholder="Search keywords"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          {query && (
            <span className="icon-button" onClick={() => setQuery('')}>
              ×
            </span>
          )}
        </div>
      </div>
      {error && <p className="error-text">{error}</p>}
      <div className="table-wrap">
        <table aria-label="Keywords">
          <thead>
            <tr>
              <th>Keyword</th>
              <th>Match type</th>
              <th>Status</th>
              <th className="num">Bid</th>
              <th className="num">Clicks</th>
              <th className="num">Spend</th>
              <th className="num">Cost ratio</th>
            </tr>
          </thead>
          <tbody>
            {keywords.map((k) => (
              <tr key={k.id}>
                <td className="text-cell">{k.text}</td>
                <td>
                  <span className="tag">{k.matchType}</span>
                </td>
                <td>
                  <span className={`dot dot-${k.status}`} title={k.status} />
                </td>
                <td className="num">{formatCents(k.bidCents)}</td>
                <td className="num">{k.clicks}</td>
                <td className="num">{formatCents(k.spendCents)}</td>
                <td className="num">{formatRatio(k.costRatio)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
