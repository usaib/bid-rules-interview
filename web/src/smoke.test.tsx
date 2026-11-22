import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { App } from './App';
import * as api from './api';

vi.mock('./api', async (importOriginal) => ({
  ...(await importOriginal<typeof import('./api')>()),
  getCampaigns: vi.fn(),
}));

describe('smoke', () => {
  it('renders the app shell', async () => {
    vi.mocked(api.getCampaigns).mockResolvedValue({ window: { from: '2026-11-13', to: '2026-11-19' }, campaigns: [] });
    render(<App />);
    expect(screen.getByRole('heading', { name: 'Bid Rules' })).toBeInTheDocument();
    expect(await screen.findByRole('table', { name: 'Campaigns' })).toBeInTheDocument();
  });
});
