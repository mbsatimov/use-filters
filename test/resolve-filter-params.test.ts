import { describe, expect, it } from 'vitest';

import { createFilters } from '../src/create-filters';

describe('resolveFilterParams', () => {
  const { f, resolveFilterParams } = createFilters();

  const configs = {
    search: f.text({ label: 'Search' }),
    status: f.select({ label: 'Status', options: [{ label: 'Open', value: 'open' }] }),
    customer_id: f.select({ label: 'Customer', options: [{ label: 'A', value: 1 }] })
  };

  it('coerces raw string search params to parser types (queryKey parity)', () => {
    const params = resolveFilterParams(configs, { customer_id: '5', status: 'open' });
    // customer_id must be a number, not the raw '5' string, so the loader's
    // key matches the hook's.
    expect(params.customer_id).toBe(5);
    expect(params.status).toBe('open');
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

  it('normalizes pagination through the default { limit, offset } mapping', () => {
    const params = resolveFilterParams(configs, { page: '3', page_size: '25' });
    expect(params.limit).toBe(25);
    expect(params.offset).toBe(50); // (3 - 1) * 25
  });

  it('applies factory defaults when pagination keys are absent', () => {
    const params = resolveFilterParams(configs, {});
    expect(params.limit).toBe(10);
    expect(params.offset).toBe(0);
  });

  it('can disable pagination', () => {
    const params = resolveFilterParams(configs, { page: '3' }, { pagination: false });
    expect(params).not.toHaveProperty('limit');
    expect(params).not.toHaveProperty('offset');
  });
});

describe('resolveFilterParams — custom mapPagination', () => {
  const { f, resolveFilterParams } = createFilters({
    pageSizeKey: 'per_page',
    mapPagination: (page, pageSize) => ({ page, page_size: pageSize })
  });

  it('honors a custom pagination shape and key', () => {
    const configs = { search: f.text({ label: 'Search' }) };
    const params = resolveFilterParams(configs, { page: '2', per_page: '20' });
    expect(params.page).toBe(2);
    expect(params.page_size).toBe(20);
  });
});

describe('createFilters — date helpers honor a custom format', () => {
  const { toDateValue, fromDateValue } = createFilters({ dateFormat: 'dd.MM.yyyy' });

  it('serializes and parses with the configured format (bound both ways)', () => {
    const stored = toDateValue(new Date(2026, 6, 9));
    expect(stored).toBe('09.07.2026');
    const back = fromDateValue(stored);
    expect(back?.getMonth()).toBe(6);
    expect(back?.getDate()).toBe(9);
  });
});
