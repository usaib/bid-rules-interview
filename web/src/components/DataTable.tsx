import type { ReactNode } from 'react';

export interface Column<T> {
  /** Unique id for the column. */
  key: string;
  header: string;
  /** The raw value. Used for sorting, and shown as text when there is no `render`. */
  value: (row: T) => string | number | null;
  /** Optional custom cell content (formatted money, a badge, ...). */
  render?: (row: T) => ReactNode;
  /** Right-align the column (numbers, money). */
  numeric?: boolean;
  /** Clicking the header sorts by this column. */
  sortable?: boolean;
}

export interface DataTableProps<T> {
  /** Shown as the table's caption; also its accessible name. */
  caption: string;
  columns: Column<T>[];
  rows: T[];
  getRowId: (row: T) => string;
  loading?: boolean;
  error?: string | null;
  /** Shown in place of rows when there are none. */
  emptyMessage: string;
  /** Rows per page. Default 10. */
  pageSize?: number;
}

/**
 * Reusable data table. See docs/SPEC.md §7 for the required behaviour.
 * Right now it only renders every row.
 */
export function DataTable<T>({ caption, columns, rows, getRowId }: DataTableProps<T>) {
  // TODO(candidate): sorting, pagination, and the loading / error / empty states (SPEC §7).
  return (
    <div className="table-wrap">
      <table>
        <caption>{caption}</caption>
        <thead>
          <tr>
            {columns.map((c) => (
              <th key={c.key} className={c.numeric ? 'num' : undefined}>
                {c.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={getRowId(row)}>
              {columns.map((c) => (
                <td key={c.key} className={c.numeric ? 'num' : undefined}>
                  {c.render ? c.render(row) : c.value(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
