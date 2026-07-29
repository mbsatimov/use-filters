import type { ArrayFormat, CommitChoice, KitChoice, ProjectConfig } from './types';

import { DEFAULTS, isDefaultDateFormat, isDefaultDateTimeFormat } from './types';
import {
  validateDateFormat,
  validateDateTimeFormat,
  validateKey,
  validateSeparator
} from './validate';

/**
 * The install URL's query string.
 *
 * Readable params rather than an opaque blob: the command someone pastes into a
 * terminal or a README says what it does — `?kit=filter-bar&perPageKey=limit` —
 * and stays hand-editable. Only fields that differ from the library's defaults
 * are written, so a stock setup is just `?kit=filter-bar`.
 *
 * `fromSearchParams` parses input a stranger can craft, so every value is
 * validated against a known set or clamped, never trusted into generated source.
 */

const KITS: KitChoice[] = ['filter-bar', 'facet-panel', 'filter-controls', 'none'];
const COMMITS: CommitChoice[] = ['instant', 'debounce', 'manual'];

export const toSearchParams = (config: ProjectConfig) => {
  const params = new URLSearchParams();
  // The kit is always written — it is the one choice with no meaningful default.
  params.set('kit', config.kit);

  const put = (key: keyof ProjectConfig) => {
    if (config[key] !== DEFAULTS[key]) params.set(key, String(config[key]));
  };

  put('pageKey');
  put('perPageKey');
  put('defaultPerPage');
  put('firstPage');
  put('resetPageOnFilterChange');
  put('arrayFormat');
  put('arraySeparator');
  // The Custom fields seed the default patterns spelled out; writing those to
  // the URL would make an untouched custom pattern look like an override.
  if (!isDefaultDateFormat(config.dateFormat)) put('dateFormat');
  if (!isDefaultDateTimeFormat(config.dateTimeFormat)) put('dateTimeFormat');
  put('defaultCommit');
  if (config.defaultCommit === 'debounce') put('debounceMs');
  put('starter');

  return params;
};

const clampInt = (value: string | null, fallback: number, min: number, max: number) => {
  const parsed = Number(value);
  if (value === null || !Number.isFinite(parsed)) return fallback;
  return Math.min(Math.max(Math.round(parsed), min), max);
};

/** Falls back to the default rather than failing, so a mistyped URL still works. */
const accepted = (
  value: string | null,
  error: (value: string) => string | undefined,
  fallback: string
) => (value !== null && !error(value) ? value : fallback);

export const fromSearchParams = (params: URLSearchParams): ProjectConfig => {
  const kit = params.get('kit') as KitChoice;
  const commit = params.get('defaultCommit') as CommitChoice;
  const format = params.get('dateFormat');

  return {
    arrayFormat: (params.get('arrayFormat') === 'string' ? 'string' : 'array') as ArrayFormat,
    arraySeparator: accepted(
      params.get('arraySeparator'),
      validateSeparator,
      DEFAULTS.arraySeparator
    ),
    // Held to the same round-trip checks the flow enforces: a pattern date-fns
    // cannot parse back would be emitted into a project and break at runtime.
    dateFormat: format && !validateDateFormat(format) ? format : DEFAULTS.dateFormat,
    dateTimeFormat: accepted(
      params.get('dateTimeFormat'),
      validateDateTimeFormat,
      DEFAULTS.dateTimeFormat
    ),
    debounceMs: clampInt(params.get('debounceMs'), DEFAULTS.debounceMs, 0, 60_000),
    defaultCommit: COMMITS.includes(commit) ? commit : DEFAULTS.defaultCommit,
    defaultPerPage: clampInt(params.get('defaultPerPage'), DEFAULTS.defaultPerPage, 1, 1000),
    firstPage: clampInt(params.get('firstPage'), DEFAULTS.firstPage, 0, 1),
    kit: KITS.includes(kit) ? kit : DEFAULTS.kit,
    pageKey: accepted(params.get('pageKey'), validateKey, DEFAULTS.pageKey),
    perPageKey: accepted(params.get('perPageKey'), validateKey, DEFAULTS.perPageKey),
    resetPageOnFilterChange: params.get('resetPageOnFilterChange') !== 'false',
    starter: params.get('starter') !== 'false'
  };
};
