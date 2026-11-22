import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as api from '../../api';
import { RulesPage } from '../RulesPage';
import { changeFixture, previewFixture, ruleFixture } from '../../test/factories';

vi.mock('../../api', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../api')>()),
  getRules: vi.fn(),
  previewRule: vi.fn(),
  applyRule: vi.fn(),
}));

describe('<RulesPage />', () => {
  beforeEach(() => {
    vi.mocked(api.getRules).mockResolvedValue({ rules: [ruleFixture()] });
  });

  it('shows the proposed bid changes after Preview', async () => {
    vi.mocked(api.previewRule).mockResolvedValue(previewFixture([changeFixture()]));
    render(<RulesPage />);

    await userEvent.click(await screen.findByRole('button', { name: /preview/i }));

    const row = await screen.findByRole('row', { name: /gift for dad/ });
    expect(within(row).getByText('$1.00')).toBeInTheDocument(); // current bid
    expect(within(row).getByText('$0.90')).toBeInTheDocument(); // new bid
    expect(within(row).getByText('50.0%')).toBeInTheDocument(); // ACoS
    expect(api.previewRule).toHaveBeenCalledWith('r1');
  });

  it('shows an empty state when nothing matches', async () => {
    vi.mocked(api.previewRule).mockResolvedValue(previewFixture([]));
    render(<RulesPage />);

    await userEvent.click(await screen.findByRole('button', { name: /preview/i }));

    expect(await screen.findByText('No keywords match this rule.')).toBeInTheDocument();
  });
});
