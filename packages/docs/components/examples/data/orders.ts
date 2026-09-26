import type { Paginated } from './api';

import { delay, isUnset, LATENCY_MS, paginate } from './api';

/**
 * The orders dataset and its fake list endpoint.
 *
 * Deterministic (no randomness), so server and client renders agree. Stands in
 * for whatever your backend's `/orders` endpoint returns.
 */

export type OrderStatus = 'failed' | 'paid' | 'pending' | 'refunded';
export type PaymentMethod = 'card' | 'crypto' | 'paypal' | 'transfer';
export type Region = 'apac' | 'eu' | 'latam' | 'na';

export interface Order {
  amount: number;
  customer: string;
  date: string; // yyyy-MM-dd
  email: string;
  id: string;
  items: number;
  method: PaymentMethod;
  region: Region;
  status: OrderStatus;
}

export const statusOptions: { label: string; value: OrderStatus }[] = [
  { label: 'Paid', value: 'paid' },
  { label: 'Pending', value: 'pending' },
  { label: 'Refunded', value: 'refunded' },
  { label: 'Failed', value: 'failed' }
];

export const methodOptions: { label: string; value: PaymentMethod }[] = [
  { label: 'Card', value: 'card' },
  { label: 'PayPal', value: 'paypal' },
  { label: 'Bank transfer', value: 'transfer' },
  { label: 'Crypto', value: 'crypto' }
];

export const regionOptions: { label: string; value: Region }[] = [
  { label: 'North America', value: 'na' },
  { label: 'Europe', value: 'eu' },
  { label: 'Asia Pacific', value: 'apac' },
  { label: 'Latin America', value: 'latam' }
];

export const sortOptions = [
  { label: 'Newest first', value: '-date' },
  { label: 'Oldest first', value: 'date' },
  { label: 'Amount, high to low', value: '-amount' },
  { label: 'Amount, low to high', value: 'amount' }
];

const customers = [
  'Ada Lovelace',
  'Alan Turing',
  'Grace Hopper',
  'Katherine Johnson',
  'Edsger Dijkstra',
  'Barbara Liskov',
  'Donald Knuth',
  'Margaret Hamilton',
  'Linus Torvalds',
  'Radia Perlman',
  'Tim Berners-Lee',
  'Anita Borg',
  'Ken Thompson',
  'Frances Allen',
  'Dennis Ritchie',
  'Shafi Goldwasser',
  'Guido van Rossum',
  'Karen Spärck Jones',
  'John Carmack',
  'Sophie Wilson',
  'Bjarne Stroustrup',
  'Joan Clarke'
];

const statuses: OrderStatus[] = [
  'paid',
  'paid',
  'pending',
  'refunded',
  'paid',
  'failed',
  'pending'
];
const methods: PaymentMethod[] = ['card', 'paypal', 'card', 'transfer', 'crypto', 'card'];
const regions: Region[] = ['na', 'eu', 'apac', 'latam', 'eu', 'na'];

/** Deterministic dataset (no randomness — SSR and client stay identical). */
export const orders: Order[] = Array.from({ length: 100 }, (_, i) => {
  const customer = customers[i % customers.length];
  // Spread the orders across 2026 so every row has a distinct date — an evenly
  // stepped offset from a fixed start, with a small stagger so it isn't uniform.
  const date = new Date(Date.UTC(2026, 0, 6 + i * 5 + (i % 7)));
  return {
    id: `#${3200 + i}`,
    customer,
    email: `${customer.toLowerCase().replace(/[^a-z]+/g, '.')}@example.com`,
    status: statuses[i % statuses.length],
    method: methods[i % methods.length],
    region: regions[i % regions.length],
    items: ((i * 3) % 7) + 1,
    date: date.toISOString().slice(0, 10),
    amount: 40 + ((i * 137) % 4960)
  };
});

/** Initials for the customer avatar, e.g. "Ada Lovelace" → "AL". */
export function initials(name: string) {
  return name
    .split(' ')
    .slice(0, 2)
    .map((part) => part[0])
    .join('');
}

/**
 * Query parameters the orders endpoint accepts. This is the contract an
 * example's filter config is validated against: every filter is optional and
 * nullable, pagination is always present. Ranges are `[min, max]` tuples so
 * they line up with `f.numberRange` / `f.dateRange`; either end of a date
 * range may be an empty string for an open-ended range.
 */
export interface OrderListParams {
  amount?: [number, number] | null;
  /** Exact customer name, as chosen from the typeahead. */
  customer?: string | null;
  /** `[from, to]` as `yyyy-MM-dd`; an empty string leaves that end open. */
  date?: [string, string] | null;
  method?: PaymentMethod[] | null;
  min_items?: number | null;
  /** `field` ascending, `-field` descending — the convention `sortOptions` uses. */
  ordering?: string | null;
  page: number;
  per_page: number;
  region?: Region[] | null;
  /** Free text matched against id, customer, and email. */
  search?: string | null;
  status?: OrderStatus[] | null;
}

/** Rows matching every provided filter. Unset filters are skipped. */
function applyFilters(rows: Order[], params: OrderListParams): Order[] {
  const { search, status, method, region, customer, amount, date, min_items } = params;

  return rows.filter((order) => {
    if (!isUnset(search)) {
      const needle = search!.trim().toLowerCase();
      const haystack = `${order.id} ${order.customer} ${order.email}`.toLowerCase();
      if (!haystack.includes(needle)) return false;
    }
    if (!isUnset(status) && !status!.includes(order.status)) return false;
    if (!isUnset(method) && !method!.includes(order.method)) return false;
    if (!isUnset(region) && !region!.includes(order.region)) return false;
    if (!isUnset(customer) && order.customer !== customer) return false;
    if (!isUnset(amount)) {
      const [min, max] = amount!;
      if (order.amount < min || order.amount > max) return false;
    }
    if (!isUnset(date)) {
      // Dates are `yyyy-MM-dd`, so lexicographic comparison is chronological.
      const [from, to] = date!;
      if (from && order.date < from) return false;
      if (to && order.date > to) return false;
    }
    if (!isUnset(min_items) && order.items < min_items!) return false;
    return true;
  });
}

/** Comparators for the fields `sortOptions` exposes. */
const comparators: Record<string, (a: Order, b: Order) => number> = {
  amount: (a, b) => a.amount - b.amount,
  customer: (a, b) => a.customer.localeCompare(b.customer),
  date: (a, b) => a.date.localeCompare(b.date),
  items: (a, b) => a.items - b.items
};

/** Sort by an `ordering` token such as `date` or `-amount`. Unknown fields keep source order. */
function applyOrdering(rows: Order[], ordering: string | null | undefined): Order[] {
  if (isUnset(ordering)) return rows;
  const descending = ordering!.startsWith('-');
  const field = descending ? ordering!.slice(1) : ordering!;
  const compare = comparators[field];
  if (!compare) return rows;
  // Copy first: callers pass the shared dataset and `sort` mutates in place.
  return [...rows].sort((a, b) => (descending ? -compare(a, b) : compare(a, b)));
}

/**
 * The orders list endpoint: filter, sort, then paginate, exactly as a server
 * would. Pass the `params` object straight from `useFilters`.
 */
export async function fetchOrders(
  params: OrderListParams,
  options: { signal?: AbortSignal } = {}
): Promise<Paginated<Order>> {
  await delay(LATENCY_MS, options.signal);
  const matched = applyOrdering(applyFilters(orders, params), params.ordering);
  return paginate(matched, params.page, params.per_page);
}

/** One selectable customer, in the `{ value, label }` shape the async builders expect. */
export interface CustomerOption {
  label: string;
  value: string;
}

/**
 * A server-searched, paginated customer list, for `f.asyncSelect` /
 * `f.asyncMultiSelect`. Mirrors a typeahead endpoint: it takes the query the
 * user typed plus a page number and returns one page of ranked matches.
 */
export async function searchCustomers(
  params: { page: number; per_page: number; search: string },
  options: { signal?: AbortSignal } = {}
): Promise<Paginated<CustomerOption>> {
  await delay(LATENCY_MS, options.signal);

  const needle = params.search.trim().toLowerCase();
  const names = [...new Set(orders.map((order) => order.customer))].sort((a, b) =>
    a.localeCompare(b)
  );
  const matched = names
    .filter((name) => !needle || name.toLowerCase().includes(needle))
    .map((name) => ({ value: name, label: name }));

  return paginate(matched, params.page, params.per_page);
}
