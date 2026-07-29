import { DATE_FORMAT, DATE_TIME_FORMAT } from '@mbsatimov/use-filters';
import { format, isValid, parse } from 'date-fns';

/**
 * The rules for the free-text answers, shared by the flow and the install
 * endpoint so a hand-edited URL is held to exactly what the UI enforces.
 *
 * Each validator returns an error message, or `undefined` when the value is
 * good — so a caller can render the reason rather than only a red border.
 */

/** Safe as a JS identifier, which is what a param key becomes in `params`. */
const KEY_PATTERN = /^[a-z_$][\w$]*$/i;

export const validateKey = (value: string) => {
  if (!value) return 'Required';
  if (value.length > 64) return 'Too long';
  if (!KEY_PATTERN.test(value)) return 'Letters, digits, _ and $ only, not starting with a digit';
  return undefined;
};

/**
 * A separator sits between values inside one query param, so it must never be
 * something that could appear in a value or in the query string's own grammar.
 * Letters and digits are the dangerous case: `arraySeparator: 'a'` would split
 * `paid,pending` in the middle of a word and silently corrupt every array param.
 */
const SEPARATOR_PATTERN = /^[^\s\w&=?#%]{1,3}$/;

export const validateSeparator = (value: string) => {
  if (!value) return 'Required';
  if (/\w/.test(value)) return 'Letters, digits and _ would be mistaken for part of a value';
  if (/\s/.test(value)) return 'Whitespace does not survive a URL round-trip';
  if (/[&=?#%]/.test(value)) return 'Reserved by the query string itself';
  if (!SEPARATOR_PATTERN.test(value)) return 'Use one to three punctuation characters';
  return undefined;
};

/** Drops anything a separator may not contain, for filtering as the user types. */
export const sanitizeSeparator = (value: string) =>
  [...value]
    .filter((char) => !/[\s\w&=?#%]/.test(char))
    .join('')
    .slice(0, 3);

/** A fixed moment, so a format preview never shifts with the clock. */
const SAMPLE = new Date(2026, 2, 9, 14, 30, 45);
const SAMPLE_ISO = '2026-03-09';
const SAMPLE_MINUTE = '14:30';

/**
 * Deliberately a different year, month and day from the sample. `parse` fills
 * anything the pattern omits from this reference, so a lossy pattern like
 * `dd/MM` reads back as 1999 and fails the round-trip. Using today's date here
 * would hide exactly that bug for the rest of the current year.
 */
const REFERENCE = new Date(1999, 6, 22);

/**
 * Checks a pattern by actually running it through date-fns, in both directions.
 *
 * A format that only renders is not enough: the library parses these strings
 * back out of the URL, so a pattern that drops the year (`dd/MM`) round-trips
 * to the wrong date — and a datetime pattern that drops the time reads back
 * midnight. Both failures are caught here rather than at runtime in someone's
 * app. Datetime patterns are held to the minute; seconds may be omitted.
 */
const validatePattern = (pattern: string, granularity: 'date' | 'datetime') => {
  if (!pattern.trim()) return 'Enter a date-fns pattern';

  let rendered: string;
  try {
    rendered = format(SAMPLE, pattern);
  } catch (error) {
    // date-fns throws a genuinely helpful RangeError for the common mistakes
    // (`YYYY` for `yyyy`, `DD` for `dd`), so surface its own wording — but only
    // the advice, not the appended input dump and docs link.
    if (!(error instanceof RangeError)) return 'Not a valid pattern';
    return error.message.split(/[;(]/)[0].trim();
  }

  if (!rendered) return 'Produces an empty string';

  let parsed: Date;
  try {
    parsed = parse(rendered, pattern, REFERENCE);
  } catch {
    return 'date-fns cannot parse this format back';
  }

  if (!isValid(parsed)) return 'date-fns cannot parse this format back';
  if (format(parsed, 'yyyy-MM-dd') !== SAMPLE_ISO) {
    return 'Loses part of the date — filters would read back the wrong day';
  }
  if (granularity === 'datetime' && format(parsed, 'HH:mm') !== SAMPLE_MINUTE) {
    return 'Loses the time of day — datetime filters would read back midnight';
  }

  return undefined;
};

export const validateDateFormat = (pattern: string) => validatePattern(pattern, 'date');

export const validateDateTimeFormat = (pattern: string) => validatePattern(pattern, 'datetime');

/** The sample rendered with a pattern, for the step's example panel. */
export const previewDate = (pattern: string) => {
  try {
    return format(SAMPLE, pattern || DATE_FORMAT);
  } catch {
    return '—';
  }
};

export const previewDateTime = (pattern: string) => {
  try {
    return format(SAMPLE, pattern || DATE_TIME_FORMAT);
  } catch {
    return '—';
  }
};
