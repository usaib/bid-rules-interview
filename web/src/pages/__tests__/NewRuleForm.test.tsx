import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as api from '../../api';
import { RulesPage } from '../RulesPage';
import { campaignFixture, ruleFixture } from '../../test/factories';

vi.mock('../../api', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../api')>()),
  getRules: vi.fn(),
  getCampaigns: vi.fn(),
  createRule: vi.fn(),
}));

describe('New rule form', () => {
  beforeEach(() => {
    vi.mocked(api.getRules).mockResolvedValue({ rules: [ruleFixture()] });
    vi.mocked(api.getCampaigns).mockResolvedValue({ window: { from: '', to: '' }, campaigns: [campaignFixture()] });
  });

  it('opens a labelled form from the New rule button', async () => {
    render(<RulesPage />);
    await userEvent.click(await screen.findByRole('button', { name: 'New rule' }));

    const form = await screen.findByRole('form', { name: 'New rule' });
    expect(form).toBeInTheDocument();
    expect(screen.getByLabelText('Name')).toBeInTheDocument();
    expect(screen.getByLabelText('Maximum bid ($)')).toBeInTheDocument();
  });
});
