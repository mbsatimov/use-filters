import type { FilterOption } from '@mbsatimov/use-filters';

/** A fake "server" for the async filters — filters a static list with a delay. */
const CITIES = [
  { label: 'Tashkent', value: 1 },
  { label: 'Samarkand', value: 2 },
  { label: 'Bukhara', value: 3 },
  { label: 'Namangan', value: 4 },
  { label: 'Andijan', value: 5 },
  { label: 'Fergana', value: 6 }
];

export const loadCities = (search: string): Promise<FilterOption[]> =>
  new Promise((resolve) => {
    setTimeout(() => {
      const q = search.trim().toLowerCase();
      resolve(CITIES.filter((c) => c.label.toLowerCase().includes(q)));
    }, 300);
  });

export const statusOptions: FilterOption[] = [
  { label: 'Open', value: 'open' },
  { label: 'In progress', value: 'in_progress' },
  { label: 'Closed', value: 'closed' }
];

export const tagOptions: FilterOption[] = [
  { label: 'Bug', value: 'bug' },
  { label: 'Feature', value: 'feature' },
  { label: 'Docs', value: 'docs' },
  { label: 'Chore', value: 'chore' }
];
