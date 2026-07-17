import type { FilterOption } from '@mbsatimov/use-filters';

/**
 * Real server-searched, server-paginated async sources — no client-side
 * `.filter()`. DummyJSON's `/search` endpoints take `q` (search) and
 * `limit`/`skip` (pagination) as real query params.
 */
const DUMMYJSON_URL = 'https://dummyjson.com';
const PAGE_SIZE = 6;

interface DummyJsonProduct {
  id: number;
  title: string;
}

interface DummyJsonProductsResponse {
  products: DummyJsonProduct[];
}

interface DummyJsonUser {
  firstName: string;
  id: number;
  lastName: string;
}

interface DummyJsonUsersResponse {
  users: DummyJsonUser[];
}

/** Products, searched and paginated server-side by DummyJSON. */
export const loadProducts = async (
  search: string,
  signal?: AbortSignal
): Promise<FilterOption[]> => {
  const endpoint = search.trim()
    ? `${DUMMYJSON_URL}/products/search?q=${encodeURIComponent(search)}&limit=${PAGE_SIZE}`
    : `${DUMMYJSON_URL}/products?limit=${PAGE_SIZE}`;
  const res = await fetch(endpoint, { signal });
  if (!res.ok) throw new Error(`Failed to fetch products: ${res.status}`);
  const data = (await res.json()) as DummyJsonProductsResponse;
  return data.products.map((product) => ({ label: product.title, value: product.id }));
};

/** Users, searched and paginated server-side by DummyJSON. */
export const loadOwners = async (search: string, signal?: AbortSignal): Promise<FilterOption[]> => {
  const endpoint = search.trim()
    ? `${DUMMYJSON_URL}/users/search?q=${encodeURIComponent(search)}&limit=${PAGE_SIZE}`
    : `${DUMMYJSON_URL}/users?limit=${PAGE_SIZE}`;
  const res = await fetch(endpoint, { signal });
  if (!res.ok) throw new Error(`Failed to fetch users: ${res.status}`);
  const data = (await res.json()) as DummyJsonUsersResponse;
  return data.users.map((user) => ({
    label: `${user.firstName} ${user.lastName}`,
    value: user.id
  }));
};

export const statusOptions: { value: 'open' | 'in_progress' | 'closed'; label: string }[] = [
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
