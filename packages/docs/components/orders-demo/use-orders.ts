'use client';

import { f, useFilters } from '@mbsatimov/use-filters';
import { parseAsInteger, useQueryState } from 'nuqs';
import { useMemo } from 'react';

import {
  methodOptions,
  type Order,
  orders,
  regionOptions,
  sortOptions,
  statusOptions
} from '@/lib/orders';

export const FIRST_PAGE = 1;
export const PER_PAGE_DEFAULT = 10;
export const PER_PAGE_OPTIONS = [10, 25, 50];

/**
 * The whole demo is driven by this one object. Every control in the toolbar,
 * every chip, and every key in the URL comes from it — add a filter here and
 * its control renders itself, with no other wiring.
 */
const filterConfig = {
  q: f.text({ label: 'Search', commit: { debounce: 300 } }),
  status: f.multiSelect({ label: 'Status', valueType: 'string', options: statusOptions }),
  method: f.multiSelect({ label: 'Method', valueType: 'string', options: methodOptions }),
  region: f.multiSelect({ label: 'Region', valueType: 'string', options: regionOptions }),
  // `commit: 'manual'` holds a draft until Apply, so dragging a range around
  // doesn't rewrite the URL (or refetch) on every keystroke.
  amount: f.numberRange({ label: 'Amount', commit: 'manual' }),
  period: f.dateRange({ label: 'Date', commit: 'manual' }),
  sort: f.select({
    label: 'Sort',
    valueType: 'string',
    options: sortOptions,
    defaultValue: '-date'
  })
};

type OrderParams = ReturnType<typeof useFilters<never, typeof filterConfig>>['params'];

/** Narrows the dataset. Stands in for the `where` clause you'd send an API. */
function applyFilters(list: Order[], params: OrderParams) {
  const query = params.q?.toLowerCase().trim();
  const [from, to] = params.period ?? ['', ''];
  const [min, max] = params.amount ?? [null, null];

  return list.filter((order) => {
    const haystack = `${order.customer} ${order.email} ${order.id}`.toLowerCase();
    if (query && !haystack.includes(query)) return false;
    if (params.status?.length && !params.status.includes(order.status)) return false;
    if (params.method?.length && !params.method.includes(order.method)) return false;
    if (params.region?.length && !params.region.includes(order.region)) return false;
    if (min != null && order.amount < min) return false;
    if (max != null && order.amount > max) return false;
    if (from && order.date < from) return false;
    if (to && order.date > to) return false;
    return true;
  });
}

/** `sort` is an API-style key with an optional `-` prefix for descending. */
function applySort(list: Order[], sort: string) {
  const descending = sort.startsWith('-');
  const key = (descending ? sort.slice(1) : sort) as 'amount' | 'date';

  return [...list].sort((a, b) => {
    const direction = a[key] < b[key] ? -1 : a[key] > b[key] ? 1 : 0;
    return descending ? -direction : direction;
  });
}

/**
 * Everything the demo needs: the live filter state, the rows for the current
 * page, and the pager. Filtering happens in memory here; in a real app you'd
 * hand `params` straight to your data layer instead.
 */
export function useOrders() {
  const { params, filters, isFiltered, ...restFilters } = useFilters(filterConfig, {
    pagination: { defaultPerPage: PER_PAGE_DEFAULT }
  });

  // `useFilters` owns the pagination params but doesn't drive the pager — the
  // page and page size are ours to write, so they land in the same URL.
  const [, setPage] = useQueryState('page', parseAsInteger.withDefault(FIRST_PAGE));
  const [, setPerPage] = useQueryState('per_page', parseAsInteger.withDefault(PER_PAGE_DEFAULT));

  const matches = useMemo(() => applySort(applyFilters(orders, params), params.sort), [params]);

  const total = matches.length;
  const perPage = params.per_page;
  const pageCount = Math.max(1, Math.ceil(total / perPage));
  // Clamp: shrinking the result set can leave `page` past the last page.
  const page = Math.min(params.page, pageCount);
  const start = (page - 1) * perPage;

  return {
    filters,
    isFiltered,
    ...restFilters,
    rows: matches.slice(start, start + perPage),
    total,
    start,
    page,
    pageCount,
    perPage,
    goToPage: setPage,
    setPerPage: (size: number) => {
      setPerPage(size);
      setPage(FIRST_PAGE); // a new page size invalidates the current offset
    }
  };
}
