import { afterEach, describe, expect, it, vi } from 'vitest';

import { createFilters } from '../src/create-filters';

/*
 * A `select` / `multiSelect`'s URL value type must not depend on runtime data
 * (`options`), or the hook (options fetched) and `resolveFilterParams` in a
 * route loader (options not fetched) can parse the same URL to different types.
 * `valueType` is the static, shared source of truth that fixes this.
 */

afterEach(() => {
  vi.restoreAllMocks();
});

describe('choice valueType — hook / loader parity', () => {
  it('reproduces the divergence: fetched numeric options vs empty options in the loader', () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    const { f, resolveFilterParams } = createFilters();

    // Table component: options fetched, numeric values -> sniffed as numbers.
    const withOptions = {
      customer_id: f.select({ label: 'Customer', options: [{ label: 'Acme', value: 5 }] })
    };
    // Route loader: the SAME filter, but options were not fetched here.
    const withoutOptions = {
      customer_id: f.select({ label: 'Customer', options: [] })
    };

    const fromComponent = resolveFilterParams(withOptions, { customer_id: '5' });
    const fromLoader = resolveFilterParams(withoutOptions, { customer_id: '5' });

    // The bug: same URL, two different runtime types -> two different query keys.
    expect(fromComponent.customer_id).toBe(5); // number
    expect(fromLoader.customer_id).toBe('5'); // string
    expect(fromComponent.customer_id).not.toBe(fromLoader.customer_id);
  });

  it('valueType makes every call site agree, whatever the options', () => {
    const { f, resolveFilterParams } = createFilters();

    const withOptions = {
      customer_id: f.select({
        label: 'Customer',
        valueType: 'number',
        options: [{ label: 'Acme', value: 5 }]
      })
    };
    const withoutOptions = {
      customer_id: f.select({ label: 'Customer', valueType: 'number', options: [] })
    };

    expect(resolveFilterParams(withOptions, { customer_id: '5' }).customer_id).toBe(5);
    expect(resolveFilterParams(withoutOptions, { customer_id: '5' }).customer_id).toBe(5);
  });

  it('honors valueType: "string" for numeric-looking string ids (no accidental coercion)', () => {
    const { f, resolveFilterParams } = createFilters();
    const configs = {
      code: f.select({
        label: 'Code',
        valueType: 'string',
        options: [{ label: 'A', value: '007' }]
      })
    };
    // Without value: 'string' this would coerce to the number 7 and lose the id.
    expect(resolveFilterParams(configs, { code: '007' }).code).toBe('007');
  });

  it('applies to multiSelect too', () => {
    const { f, resolveFilterParams } = createFilters();
    const withoutOptions = {
      ids: f.multiSelect({ label: 'Ids', valueType: 'number', options: [] })
    };
    expect(resolveFilterParams(withoutOptions, { ids: '1,2,3' }).ids).toEqual([1, 2, 3]);
  });
});

describe('choice valueType — indeterminate dev warning', () => {
  it('warns when a select has no options and no valueType (the loader footgun)', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const { f, resolveFilterParams } = createFilters();
    resolveFilterParams({ region: f.select({ label: 'Region', options: [] }) }, { region: 'x' });

    expect(warn).toHaveBeenCalledOnce();
    expect(warn.mock.calls[0]?.[0]).toContain('valueType');
  });

  it('does not warn once valueType is set', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const { f, resolveFilterParams } = createFilters();
    resolveFilterParams(
      { region: f.select({ label: 'Region', valueType: 'string', options: [] }) },
      { region: 'x' }
    );

    expect(warn).not.toHaveBeenCalled();
  });

  it('does not warn when options are present (value type is determinate)', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const { f, resolveFilterParams } = createFilters();
    resolveFilterParams(
      { region: f.select({ label: 'Region', options: [{ label: 'EU', value: 'eu' }] }) },
      { region: 'eu' }
    );

    expect(warn).not.toHaveBeenCalled();
  });

  it('dedupes per factory — a loader firing on every navigation warns once', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const { f, resolveFilterParams } = createFilters();
    const configs = { region: f.select({ label: 'Region', options: [] }) };

    resolveFilterParams(configs, { region: 'a' });
    resolveFilterParams(configs, { region: 'b' });

    expect(warn).toHaveBeenCalledOnce();
  });
});
