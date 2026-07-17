import { describe, expect, it } from 'vitest';

import { createFilters } from '../src/create-filters';

describe('resolveFilterParams — filter values', () => {
  const { f, resolveFilterParams } = createFilters();

  const configs = {
    search: f.text({ label: 'Search' }),
    status: f.select({ label: 'Status', options: [{ label: 'Open', value: 'open' }] }),
    customer_id: f.select({ label: 'Customer', options: [{ label: 'A', value: 1 }] }),
    price: f.numberRange({ label: 'Price' }),
    tags: f.tags({ label: 'Tags' })
  };

  it('coerces raw string search params to parser types (queryKey parity)', () => {
    const params = resolveFilterParams(configs, { customer_id: '5', status: 'open' });
    // customer_id must be a number, not the raw '5' string, so the loader's
    // key matches the hook's.
    expect(params.customer_id).toBe(5);
    expect(params.status).toBe('open');
  });

  it('coerces the array-valued kinds (numberRange, tags) too', () => {
    const params = resolveFilterParams(configs, { price: '10,20', tags: 'a,b' });
    expect(params.price).toEqual([10, 20]);
    expect(params.tags).toEqual(['a', 'b']);
  });

  it('fills unset filters with defaultValue then null', () => {
    const params = resolveFilterParams(configs, {});
    expect(params.search).toBeNull();
    expect(params.status).toBeNull();
    expect(params.customer_id).toBeNull();
  });

  it('drops unknown keys such as async _label sidecars', () => {
    const params = resolveFilterParams(configs, { customer_id: '5', customer_id_label: 'Acme' });
    expect(params).not.toHaveProperty('customer_id_label');
  });
});

describe('resolveFilterParams — raw search shapes', () => {
  const { f, resolveFilterParams } = createFilters();

  const configs = {
    search: f.text({ label: 'Search' }),
    customer_id: f.select({ label: 'Customer', options: [{ label: 'A', value: 1 }] }),
    tags: f.tags({ label: 'Tags' })
  };

  it('accepts a URLSearchParams (React Router loaders)', () => {
    const search = new URL('https://x.test/loans?search=acme&customer_id=5&page=3').searchParams;
    const params = resolveFilterParams(configs, search);
    expect(params).toEqual({ search: 'acme', customer_id: 5, tags: null, page: 3, per_page: 10 });
  });

  it('accepts a raw query string, with or without the leading "?"', () => {
    const expected = { search: 'acme', customer_id: 5, tags: ['a', 'b'], page: 1, per_page: 10 };
    expect(resolveFilterParams(configs, '?search=acme&customer_id=5&tags=a,b')).toEqual(expected);
    expect(resolveFilterParams(configs, 'search=acme&customer_id=5&tags=a,b')).toEqual(expected);
  });

  it('produces the identical object for every shape (queryKey parity)', () => {
    const fromObject = resolveFilterParams(configs, { search: 'acme', customer_id: '5' });
    const fromString = resolveFilterParams(configs, '?search=acme&customer_id=5');
    const fromSearchParams = resolveFilterParams(
      configs,
      new URLSearchParams('search=acme&customer_id=5')
    );
    expect(fromString).toEqual(fromObject);
    expect(fromSearchParams).toEqual(fromObject);
  });
});

describe('resolveFilterParams — pagination', () => {
  const { f, resolveFilterParams } = createFilters();
  const configs = { search: f.text({ label: 'Search' }) };

  it('mirrors the default page / per_page keys straight into params', () => {
    const params = resolveFilterParams(configs, { page: '3', per_page: '25' });
    expect(params.page).toBe(3);
    expect(params.per_page).toBe(25);
  });

  it('applies factory defaults when pagination keys are absent', () => {
    const params = resolveFilterParams(configs, {});
    expect(params.page).toBe(1);
    expect(params.per_page).toBe(10);
  });

  it('can be disabled', () => {
    const params = resolveFilterParams(configs, { page: '3' }, { pagination: false });
    expect(params).not.toHaveProperty('page');
    expect(params).not.toHaveProperty('per_page');
  });

  it('uses renamed keys as the params keys', () => {
    const renamed = createFilters({ pagination: { perPageKey: 'page_size' } });
    const params = renamed.resolveFilterParams(
      { search: renamed.f.text({ label: 'Search' }) },
      { page: '2', page_size: '20' }
    );
    expect(params.page).toBe(2);
    expect(params.page_size).toBe(20);
    expect(params).not.toHaveProperty('per_page');
  });

  it('starts numbering from firstPage when the page key is absent', () => {
    const zeroBased = createFilters({ pagination: { firstPage: 0 } });
    const params = zeroBased.resolveFilterParams(
      { search: zeroBased.f.text({ label: 'Search' }) },
      {}
    );
    expect(params.page).toBe(0);
    expect(params.per_page).toBe(10);
  });
});
