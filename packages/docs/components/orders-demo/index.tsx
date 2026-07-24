'use client';

import { DemoWindow } from '@/components/demo-window';
import { ActiveFilters, FilterBar } from '@/components/orders-demo/filter-bar';
import { OrdersTable } from '@/components/orders-demo/orders-table';
import { Pagination } from '@/components/orders-demo/pagination';
import { useOrders } from '@/components/orders-demo/use-orders';

/** Where "View source" points — this folder, on GitHub. */
const SOURCE_URL =
  'https://github.com/mbsatimov/use-filters/tree/main/packages/docs/components/orders-demo';

/**
 * The landing page's live demo: a filterable, URL-synced orders table.
 *
 * How the pieces fit together:
 * - `use-orders.ts`  — the `useFilters` config plus the filtering, sorting and
 *                      paging it drives. All of the state lives here.
 * - `filter-bar.tsx` — renders a control for each filter by switching on its
 *                      `type`, so the toolbar follows the config automatically.
 * - `orders-table.tsx` / `pagination.tsx` — presentational only.
 *
 * The frame comes from the shared `components/demo-window.tsx`, which every
 * demo on the site runs in.
 */
export const OrdersDemo = () => (
  <DemoWindow className='my-0' path='/orders' sourceUrl={SOURCE_URL}>
    <OrdersBrowser />
  </DemoWindow>
);

const OrdersBrowser = () => {
  const {
    filters,
    isFiltered,
    instantReset,
    rows,
    total,
    start,
    page,
    pageCount,
    perPage,
    goToPage,
    setPerPage
  } = useOrders();

  return (
    <div className='flex flex-col gap-3'>
      <FilterBar filters={filters} />
      <ActiveFilters filters={filters} onReset={instantReset} />

      <OrdersTable isFiltered={isFiltered} rows={rows} onReset={instantReset} />

      <Pagination
        page={page}
        pageCount={pageCount}
        perPage={perPage}
        start={start}
        total={total}
        onPageChange={goToPage}
        onPerPageChange={setPerPage}
      />
    </div>
  );
};
