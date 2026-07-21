import { describe, expect, it } from 'vitest';

import { f } from '../src/builders';
import { coerceRawValue } from '../src/search';

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
