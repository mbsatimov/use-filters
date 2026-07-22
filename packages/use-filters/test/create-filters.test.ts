import { describe, expect, it } from 'vitest';

import { createFilters } from '../src/create-filters';

const pad = (n: number) => String(n).padStart(2, '0');

describe('createFilters — date.serialize / date.parse overrides', () => {
  // Custom `dd.MM.yyyy` storage via the override hooks (no built-in format option).
  const { toDateValue, fromDateValue } = createFilters({
    date: {
      serialize: (date) =>
        `${pad(date.getDate())}.${pad(date.getMonth() + 1)}.${date.getFullYear()}`,
      parse: (value) => {
        const m = /^(\d{2})\.(\d{2})\.(\d{4})$/.exec(value);
        return m ? new Date(+m[3], +m[2] - 1, +m[1]) : undefined;
      }
    }
  });

  it('serializes and parses with the override (bound both ways)', () => {
    const stored = toDateValue(new Date(2026, 6, 9));
    expect(stored).toBe('09.07.2026');
    const back = fromDateValue(stored);
    expect(back?.getMonth()).toBe(6);
    expect(back?.getDate()).toBe(9);
  });
});

describe('createFilters — date.serializeDateTime / date.parseDateTime overrides', () => {
  const { toDateTimeValue, fromDateTimeValue } = createFilters({
    date: {
      serializeDateTime: (d) =>
        `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`,
      parseDateTime: (value) => {
        const m = /^(\d{2})\.(\d{2})\.(\d{4}) (\d{2}):(\d{2})$/.exec(value);
        return m ? new Date(+m[3], +m[2] - 1, +m[1], +m[4], +m[5]) : undefined;
      }
    }
  });

  it('serialize and parse are exact inverses', () => {
    const stored = toDateTimeValue(new Date(2026, 6, 9, 8, 5));
    expect(stored).toBe('09.07.2026 08:05');
    const back = fromDateTimeValue(stored);
    expect(back?.getMonth()).toBe(6);
    expect(back?.getDate()).toBe(9);
    expect(back?.getHours()).toBe(8);
    expect(back?.getMinutes()).toBe(5);
  });
});
