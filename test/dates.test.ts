import { describe, expect, it } from 'vitest';

import { fromDateTimeValue, fromDateValue, toDateTimeValue, toDateValue } from '../src/dates';

describe('toDateValue / fromDateValue (fixed yyyy-MM-dd)', () => {
  const date = new Date(2026, 6, 9); // 2026-07-09

  it('formats to yyyy-MM-dd', () => {
    expect(toDateValue(date)).toBe('2026-07-09');
  });

  it('round-trips exactly', () => {
    const back = fromDateValue(toDateValue(date));
    expect([back?.getFullYear(), back?.getMonth(), back?.getDate()]).toEqual([2026, 6, 9]);
  });

  it('parses to local midnight', () => {
    const back = fromDateValue('2026-07-09');
    expect([back?.getHours(), back?.getMinutes(), back?.getSeconds()]).toEqual([0, 0, 0]);
  });

  it('returns undefined for empty / malformed input', () => {
    expect(fromDateValue('')).toBeUndefined();
    expect(fromDateValue(null)).toBeUndefined();
    expect(fromDateValue('not-a-date')).toBeUndefined();
    expect(fromDateValue('2026/07/09')).toBeUndefined(); // wrong separator
    expect(fromDateValue('2026-7-9')).toBeUndefined(); // not zero-padded
    expect(fromDateValue('2026-07-09xx')).toBeUndefined(); // trailing junk
  });

  it('rejects out-of-range dates instead of rolling them over', () => {
    expect(fromDateValue('2026-13-09')).toBeUndefined(); // month 13
    expect(fromDateValue('2026-02-30')).toBeUndefined(); // Feb 30
  });
});

describe('toDateTimeValue / fromDateTimeValue (fixed yyyy-MM-ddTHH:mm:ss)', () => {
  const date = new Date(2026, 6, 9, 8, 5, 3);

  it('formats to yyyy-MM-ddTHH:mm:ss', () => {
    expect(toDateTimeValue(date)).toBe('2026-07-09T08:05:03');
  });

  it('round-trips exactly', () => {
    const back = fromDateTimeValue(toDateTimeValue(date));
    expect([back?.getHours(), back?.getMinutes(), back?.getSeconds()]).toEqual([8, 5, 3]);
  });

  it('returns undefined for empty / malformed / out-of-range input', () => {
    expect(fromDateTimeValue('')).toBeUndefined();
    expect(fromDateTimeValue(null)).toBeUndefined();
    expect(fromDateTimeValue('nope')).toBeUndefined();
    expect(fromDateTimeValue('2026-07-09')).toBeUndefined(); // missing time
    expect(fromDateTimeValue('2026-07-09T25:00:00')).toBeUndefined(); // hour 25
  });
});
