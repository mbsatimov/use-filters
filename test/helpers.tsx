import { renderHook } from '@testing-library/react';
import { withNuqsTestingAdapter } from 'nuqs/adapters/testing';

import type { FiltersFor, UseFiltersOptions } from '../src/types';

import { createFilters } from '../src/create-filters';

/** One default-config instance shared by every test file that doesn't need a custom factory. */
export const { useFilters, resolveFilterParams, f } = createFilters();

/** In-memory nuqs adapter that persists updates across renders. */
export const wrapper = withNuqsTestingAdapter({ hasMemory: true });

/**
 * Render `useFilters` while preserving per-config inference — `const T` keeps
 * the exact config shape so `filterMap` / `params` stay strongly typed
 * (a `Parameters<typeof useFilters>` helper collapses `T` to `{}`).
 */
export function renderFilters<const T extends FiltersFor<never>>(
  configs: T,
  options?: UseFiltersOptions
) {
  return renderHook(() => useFilters<never, T>(configs, options), { wrapper });
}

/** `as const` so option values infer as the literal union `'open' | 'closed'`. */
export const statusOptions = [
  { label: 'Open', value: 'open' },
  { label: 'Closed', value: 'closed' }
] as const;
