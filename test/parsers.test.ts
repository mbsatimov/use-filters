import { describe, expect, it } from 'vitest';

import { f } from '../src/builders';
import { buildParser } from '../src/parsers';

describe('buildParser — number precision', () => {
  it('keeps decimals by default (float)', () => {
    const parser = buildParser(f.number({ label: 'Amount' }));
    expect(parser.parse('1.5')).toBe(1.5);
    expect(parser.serialize(1.5)).toBe('1.5');
  });

  it('truncates to integers with precision: "int"', () => {
    const parser = buildParser(f.number({ label: 'Count', precision: 'int' }));
    expect(parser.parse('1.5')).toBe(1);
  });
});

describe('buildParser — select value type', () => {
  it('parses as a number when valueType is "number"', () => {
    const parser = buildParser(
      f.select({ label: 'Customer', valueType: 'number', options: [{ label: 'A', value: 1 }] })
    );
    expect(parser.parse('5')).toBe(5);
    expect(typeof parser.parse('5')).toBe('number');
  });

  it('parses as a string when valueType is "string"', () => {
    const parser = buildParser(
      f.select({
        label: 'Status',
        valueType: 'string',
        options: [{ label: 'Open', value: 'open' }]
      })
    );
    expect(parser.parse('open')).toBe('open');
  });

  it('respects valueType even when options are empty', () => {
    const parser = buildParser(
      f.select({ label: 'Late', valueType: 'number', options: [], defaultValue: 7 })
    );
    expect(parser.parse('9')).toBe(9);
    expect(typeof parser.parse('9')).toBe('number');
  });
});

describe('buildParser — numberRange', () => {
  it('round-trips a [min, max] float pair', () => {
    const parser = buildParser(f.numberRange({ label: 'Price' }));
    expect(parser.parse('1.5,3.5')).toEqual([1.5, 3.5]);
    expect(parser.serialize([1.5, 3.5] as never)).toBe('1.5,3.5');
  });

  it('parses integers only with precision: "int"', () => {
    const parser = buildParser(f.numberRange({ label: 'Age', precision: 'int' }));
    expect(parser.parse('1.9,3.9')).toEqual([1, 3]);
  });
});

describe('buildParser — tags', () => {
  it('round-trips a freeform string array', () => {
    const parser = buildParser(f.tags({ label: 'Tags' }));
    expect(parser.parse('alpha,beta')).toEqual(['alpha', 'beta']);
    expect(parser.serialize(['alpha', 'beta'] as never)).toBe('alpha,beta');
  });
});

describe('buildParser — time & timeRange', () => {
  it('stores a time-of-day string as-is', () => {
    const parser = buildParser(f.time({ label: 'Opens at' }));
    expect(parser.parse('09:30')).toBe('09:30');
    expect(parser.serialize('09:30' as never)).toBe('09:30');
  });

  it('round-trips a [from, to] time pair', () => {
    const parser = buildParser(f.timeRange({ label: 'Hours' }));
    expect(parser.parse('09:00,17:00')).toEqual(['09:00', '17:00']);
    expect(parser.serialize(['09:00', '17:00'] as never)).toBe('09:00,17:00');
  });
});
