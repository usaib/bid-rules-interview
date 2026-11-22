import { render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import * as api from '../../api';
import { CampaignsPage } from '../CampaignsPage';
import { campaignFixture } from '../../test/factories';

vi.mock('../../api', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../api')>()),
  getCampaigns: vi.fn(),
}));

describe('<CampaignsPage />', () => {
  it('renders campaign rows with formatted money and ACoS', async () => {
    vi.mocked(api.getCampaigns).mockResolvedValue({
      window: { from: '2026-11-13', to: '2026-11-19' },
      campaigns: [campaignFixture(), campaignFixture({ id: 'c2', name: 'Brand Defense', salesCents: 0, acos: null })],
    });

    render(<CampaignsPage />);

    const row = await screen.findByRole('row', { name: /Holiday Gifts/ });
    expect(within(row).getByText('$45.67')).toBeInTheDocument();
    expect(within(row).getByText('38.1%')).toBeInTheDocument();
    expect(within(screen.getByRole('row', { name: /Brand Defense/ })).getByText('—')).toBeInTheDocument();
  });
});
