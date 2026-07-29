import { describe, expect, it } from 'vitest';

import type { FilterEntry } from '../src/types';

import { f } from '../src/builders';
import { buildParser, buildParserMap, fingerprintFilterConfigs } from '../src/parsers';

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

describe('fingerprintFilterConfigs', () => {
  const fingerprint = (entries: FilterEntry[]) => fingerprintFilterConfigs(entries);

  it('is stable across separate configs with identical content', () => {
    // The whole point: an inline config literal is a new object every render.
    expect(fingerprint([['search', f.text({ label: 'Search' })]])).toBe(
      fingerprint([['search', f.text({ label: 'Search' })]])
    );
  });

  it('ignores fields that do not affect parsing', () => {
    expect(fingerprint([['search', f.text({ label: 'Search' })]])).toBe(
      fingerprint([['search', f.text({ label: 'Qidiruv', placeholder: 'x', hidden: true })]])
    );
  });

  it('changes when the default value changes', () => {
    expect(fingerprint([['n', f.number({ label: 'N' })]])).not.toBe(
      fingerprint([['n', f.number({ label: 'N', defaultValue: 1 })]])
    );
  });

  it('changes when precision changes', () => {
    expect(fingerprint([['n', f.number({ label: 'N' })]])).not.toBe(
      fingerprint([['n', f.number({ label: 'N', precision: 'int' })]])
    );
  });

  it('changes when a nuqs option changes', () => {
    expect(fingerprint([['s', f.text({ label: 'S', nuqs: { history: 'replace' } })]])).not.toBe(
      fingerprint([['s', f.text({ label: 'S', nuqs: { history: 'push' } })]])
    );
  });

  it('changes when the key changes', () => {
    expect(fingerprint([['a', f.text({ label: 'S' })]])).not.toBe(
      fingerprint([['b', f.text({ label: 'S' })]])
    );
  });
});

describe('buildParserMap', () => {
  const pagination = {
    defaultPerPage: 10,
    firstPage: 1,
    pageKey: 'page',
    perPageKey: 'per_page'
  };

  it('maps one parser per filter key', () => {
    const map = buildParserMap([['search', f.text({ label: 'Search' })]], ',', null);
    expect(Object.keys(map)).toEqual(['search']);
  });

  it('adds a label sidecar for async filters only', () => {
    const map = buildParserMap(
      [
        ['search', f.text({ label: 'Search' })],
        [
          'customer',
          f.asyncSelect({ label: 'Customer', valueType: 'number', loadOptions: async () => [] })
        ]
      ],
      ',',
      null
    );
    expect(Object.keys(map).sort()).toEqual(['customer', 'customer_label', 'search']);
  });

  it('adds the pagination pair when pagination is enabled', () => {
    const map = buildParserMap([], ',', pagination);
    expect(Object.keys(map).sort()).toEqual(['page', 'per_page']);
    expect(map.page.defaultValue).toBe(1);
    expect(map.per_page.defaultValue).toBe(10);
  });

  it('omits pagination entirely when it is disabled', () => {
    expect(Object.keys(buildParserMap([], ',', null))).toEqual([]);
  });

  it('honours the array separator for array-shaped filters', () => {
    const map = buildParserMap([['tags', f.tags({ label: 'Tags' })]], '|', null);
    expect(map.tags.parse('a|b' as never)).toEqual(['a', 'b']);
  });

  it('applies a filter’s nuqs options to its label sidecar too', () => {
    const map = buildParserMap(
      [
        [
          'customer',
          f.asyncSelect({
            label: 'Customer',
            valueType: 'number',
            nuqs: { history: 'push' },
            loadOptions: async () => []
          })
        ]
      ],
      ',',
      null
    );
    expect(map.customer.history).toBe('push');
    expect(map.customer_label.history).toBe('push');
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
