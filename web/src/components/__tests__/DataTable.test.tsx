import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { DataTable, type Column } from '../DataTable';

interface Item {
  id: string;
  name: string;
  clicks: number;
}

const columns: Column<Item>[] = [
  { key: 'name', header: 'Name', value: (r) => r.name, sortable: true },
  { key: 'clicks', header: 'Clicks', value: (r) => r.clicks, numeric: true, sortable: true },
];
const rows: Item[] = [
  { id: 'a', name: 'alpha', clicks: 30 },
  { id: 'b', name: 'bravo', clicks: 4 },
  { id: 'c', name: 'charlie', clicks: 120 },
];
const names = () => screen.getAllByRole('row').slice(1).map((r) => within(r).getAllByRole('cell')[0].textContent);

describe('<DataTable />', () => {
  it('renders a captioned table with one row per item', () => {
    render(<DataTable caption="Items" columns={columns} rows={rows} getRowId={(r) => r.id} emptyMessage="No items" />);
    expect(screen.getByRole('table', { name: 'Items' })).toBeInTheDocument();
    expect(names()).toEqual(['alpha', 'bravo', 'charlie']);
  });

  it('sorts by a column when its header is clicked', async () => {
    render(<DataTable caption="Items" columns={columns} rows={rows} getRowId={(r) => r.id} emptyMessage="No items" />);
    await userEvent.click(screen.getByRole('button', { name: 'Clicks' }));
    expect(names()).toEqual(['bravo', 'alpha', 'charlie']);
  });
});
