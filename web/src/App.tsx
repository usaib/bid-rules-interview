import { useState } from 'react';
import { CampaignsPage } from './pages/CampaignsPage';
import { KeywordsPage } from './pages/KeywordsPage';
import { RulesPage } from './pages/RulesPage';

const TABS = [
  { id: 'campaigns', label: 'Campaigns', Page: CampaignsPage },
  { id: 'rules', label: 'Bid rules', Page: RulesPage },
  { id: 'keywords', label: 'Keywords', Page: KeywordsPage },
] as const;

type TabId = (typeof TABS)[number]['id'];

export function App() {
  const [tab, setTab] = useState<TabId>('campaigns');
  const { Page } = TABS.find((t) => t.id === tab)!;

  return (
    <div className="app">
      <header className="topbar">
        <div className="topbar-inner">
          <div className="brand">
            <span className="brand-mark" aria-hidden="true" />
            <h1>Bid Rules</h1>
          </div>
          <nav aria-label="Main">
            {TABS.map((t) => (
              <button key={t.id} aria-pressed={tab === t.id} onClick={() => setTab(t.id)}>
                {t.label}
              </button>
            ))}
          </nav>
          <div className="topbar-meta">
            <span>Sponsored Products · US</span>
            <span>Pacific time</span>
          </div>
        </div>
      </header>
      <main>
        <Page />
      </main>
    </div>
  );
}
