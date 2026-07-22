// Default date (de)serialization: fixed ISO shapes, no format-string engine.
// Override `date.serialize` / `date.parse` on `createFilters` to change them.

/** The fixed format `date` filters serialize to (default). */
export const DATE_FORMAT = 'yyyy-MM-dd';

/** The fixed format datetime filters serialize to — `date`/`dateRange` with `precision: 'datetime'`. */
export const DATE_TIME_FORMAT = "yyyy-MM-dd'T'HH:mm:ss";

const pad2 = (value: number): string => String(value).padStart(2, '0');

/**
 * Build a local `Date` from parts, `undefined` for out-of-range input. The
 * `Date` constructor silently rolls parts over (Feb 30 → March), so a component
 * that changed after construction means the input was invalid.
 */
const buildDate = (
  year: number,
  month: number, // 1-12
  day: number,
  hours = 0,
  minutes = 0,
  seconds = 0
): Date | undefined => {
  const date = new Date(year, month - 1, day, hours, minutes, seconds);
  if (
    Number.isNaN(date.getTime()) ||
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day ||
    date.getHours() !== hours ||
    date.getMinutes() !== minutes ||
    date.getSeconds() !== seconds
  ) {
    return undefined;
  }
  return date;
};

/** `Date` -> `yyyy-MM-dd` (local). */
export const toDateValue = (date: Date): string =>
  `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;

/** `yyyy-MM-dd` -> `Date`, or `undefined` when empty / malformed / out of range. */
export const fromDateValue = (value?: string | null): Date | undefined => {
  if (!value) return undefined;
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  return match ? buildDate(+match[1], +match[2], +match[3]) : undefined;
};

/** `Date` -> `yyyy-MM-ddTHH:mm:ss` (local). */
export const toDateTimeValue = (date: Date): string =>
  `${toDateValue(date)}T${pad2(date.getHours())}:${pad2(date.getMinutes())}:${pad2(date.getSeconds())}`;

/** `yyyy-MM-ddTHH:mm:ss` -> `Date`, or `undefined` when empty / malformed / out of range. */
export const fromDateTimeValue = (value?: string | null): Date | undefined => {
  if (!value) return undefined;
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})$/.exec(value);
  return match
    ? buildDate(+match[1], +match[2], +match[3], +match[4], +match[5], +match[6])
    : undefined;
};
