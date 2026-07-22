import { describe, expect, it } from 'vitest';

import { f } from '../src/builders';
import { coerceRawValue, serializeParamsKey } from '../src/search';

describe('coerceRawValue', () => {
  const config = f.select({
    label: 'Customer',
    valueType: 'number',
    options: [{ label: 'A', value: 1 }]
  });

  it('parses a raw URL string to the parser type', () => {
    expect(coerceRawValue(config, '5')).toBe(5);
  });

  it('passes through an already-typed value', () => {
    expect(coerceRawValue(config, 5)).toBe(5);
  });

  it('falls back to defaultValue then null when absent', () => {
    expect(coerceRawValue(config, undefined)).toBeNull();
    const withDefault = f.select({
      label: 'Customer',
      valueType: 'number',
      options: [{ label: 'A', value: 1 }],
      defaultValue: 1
    });
    expect(coerceRawValue(withDefault, undefined)).toBe(1);
  });
});

describe('serializeParamsKey', () => {
  it('sorts keys so key order never changes the string', () => {
    const a = serializeParamsKey({ status: 'open', search: 'acme', page: 1 });
    const b = serializeParamsKey({ page: 1, status: 'open', search: 'acme' });
    expect(a).toBe(b);
    expect(a).toBe('page=1&search=acme&status=open');
  });

  it('drops null / undefined / empty values (equivalent states collide)', () => {
    const withEmpty = serializeParamsKey({ search: 'acme', status: null, tags: [], note: '' });
    const without = serializeParamsKey({ search: 'acme' });
    expect(withEmpty).toBe(without);
    expect(withEmpty).toBe('search=acme');
  });

  it('joins array values with the separator; keeps 0 and false', () => {
    expect(serializeParamsKey({ ids: [1, 2, 3] })).toBe('ids=1,2,3');
    expect(serializeParamsKey({ tags: ['a', 'b'] }, '|')).toBe('tags=a|b');
    expect(serializeParamsKey({ count: 0, active: false })).toBe('active=false&count=0');
  });

  it('url-encodes values so special characters cannot collide', () => {
    expect(serializeParamsKey({ q: 'a&b=c' })).toBe('q=a%26b%3Dc');
  });
});
