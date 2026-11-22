import type { SortOrder } from '@bidrules/shared';

/** Returns a new array sorted by `key`. */
export function sortBy<T>(rows: T[], key: keyof T, order: SortOrder): T[] {
  return [...rows].sort((a, b) => {
    const av = a[key];
    const bv = b[key];
    return order === 'asc' ? Number(av > bv) : Number(av < bv);
  });
}
