import type { FilterConfig } from './types';

import { buildParser, DEFAULT_ARRAY_SEPARATOR } from './parsers';

/**
 * The raw-search shapes `resolveFilterParams` accepts, whatever your router
 * hands you: a parsed object (TanStack Router), a `URLSearchParams` (React
 * Router loaders), or the raw query string (leading `?` optional).
 */
export type RawSearchParams = string | Record<string, unknown> | URLSearchParams;

/** Normalize any accepted raw-search shape into a plain object (last value wins for repeated keys). */
export const normalizeRawSearch = (raw: RawSearchParams): Record<string, unknown> => {
  if (typeof raw === 'string') return Object.fromEntries(new URLSearchParams(raw));
  if (raw instanceof URLSearchParams) return Object.fromEntries(raw);
  return raw;
};

/**
 * Coerce a single raw search value into the same runtime type the hook's nuqs
 * parsers produce, so a loader's params match the hook's exactly (`5`, not `'5'`).
 * Pass the hook's `separator` so array-shaped values split identically.
 */
export const coerceRawValue = (
  config: FilterConfig,
  raw: unknown,
  separator: string = DEFAULT_ARRAY_SEPARATOR
): unknown => {
  if (raw == null) return config.defaultValue ?? null;
  if (typeof raw !== 'string') return raw; // already coerced upstream
  const parsed = buildParser(config, separator).parse(raw);
  return parsed ?? config.defaultValue ?? null;
};
