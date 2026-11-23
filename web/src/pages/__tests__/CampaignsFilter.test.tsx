import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import * as api from '../../api';
import { CampaignsPage } from '../CampaignsPage';
import { campaignFixture } from '../../test/factories';

vi.mock('../../api', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../api')>()),
  getCampaigns: vi.fn(),
  setCampaignStatus: vi.fn(),
}));

describe('<CampaignsPage /> filter and pause', () => {
  it('"Show: Paused" lists only paused campaigns, each with a Resume button', async () => {
    vi.mocked(api.getCampaigns).mockResolvedValue({
      window: { from: '2026-11-13', to: '2026-11-19' },
      campaigns: [campaignFixture(), campaignFixture({ id: 'c2', name: 'Clearance', status: 'paused' })],
    });

    render(<CampaignsPage />);
    await screen.findByText('Holiday Gifts - SP');

    await userEvent.selectOptions(screen.getByLabelText('Show'), 'paused');

    expect(screen.queryByText('Holiday Gifts - SP')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Resume Clearance' })).toBeInTheDocument();
  });
});
