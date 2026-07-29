import type {
  AsyncMultiSelectFilterConfig,
  AsyncSelectFilterConfig,
  FilterCommitMode,
  FilterConfig,
  FilterOption,
  FilterPrimitive,
  ParamsChangeCause,
  ParamValue,
  SelectedOption
} from './types';

import { debounceAsync, DEFAULT_ASYNC_DEBOUNCE_MS } from './debounce';
import { hasFilterValue, labelKeyOf, valuesEqual } from './filter-utils';

/**
 * The pure half of building a `ResolvedFilter`: given a config, its committed
 * URL value and any draft, derive the fields the UI reads. No React, no URL
 * writes — the hook supplies `schedule` and assembles the result.
 */

/** A change routed through a filter's `commit` mode. */
export interface ScheduledChange {
  /** What to report to `onParamsChange` when this change commits. Defaults to `'change'`. */
  cause?: ParamsChangeCause;
  key: string;
  /** Label sidecar — async filters only, so it defaults to `null` for every other kind. */
  labels?: string | string[] | null;
  /** The filter's *effective* commit mode. */
  mode: FilterCommitMode;
  value: ParamValue;
}

/** Routes a change through its commit mode — `useFilters`' `schedule`. */
export type ScheduleChange = (change: ScheduledChange) => void;

/** A filter's committed URL value plus its label sidecar, both normalized to `null`. */
export interface CommittedValue {
  labels: string | string[] | null;
  value: ParamValue;
}

/** Read a filter's committed URL value + label sidecar, normalized to `null`. */
export const readCommitted = (values: Record<string, unknown>, key: string): CommittedValue => ({
  value: (values[key] ?? null) as ParamValue,
  labels: (values[labelKeyOf(key)] ?? null) as string | string[] | null
});

/** The value `reset` / `instantReset` return a filter to. */
export const defaultValueOf = (config: FilterConfig): ParamValue =>
  (config.defaultValue ?? null) as ParamValue;

/** Whether a value counts as "filtered": differs from `defaultValue`, or (no default) is non-empty. */
export const differsFromDefault = (config: FilterConfig, value: ParamValue): boolean =>
  config.defaultValue !== undefined
    ? !valuesEqual(value, config.defaultValue)
    : hasFilterValue(value);

/**
 * Dev-only guard: warn once per filter when `loadOptions` returns ids of a type
 * that contradicts `valueType` (URL values wouldn't round-trip). Pass-through in prod.
 */
const withValueTypeCheck = (
  key: string,
  config: AsyncMultiSelectFilterConfig | AsyncSelectFilterConfig,
  warned: Set<string>
): ((search: string, signal: AbortSignal) => Promise<FilterOption[]>) => {
  if (process.env.NODE_ENV === 'production') return config.loadOptions;
  return async (search, signal) => {
    const options = await config.loadOptions(search, signal);
    const expected = config.valueType;
    const sample = options.find((option) => option.value != null);
    const actual = typeof sample?.value === 'number' ? 'number' : 'string';
    if (sample && actual !== expected && !warned.has(key)) {
      warned.add(key);
      console.warn(
        `[useFilters] "${key}": loadOptions returned ${actual}-valued options, but its valueType is '${expected}' — URL values won't round-trip${
          expected === 'number' ? ' (string ids parse back as null)' : ''
        }. Set valueType: '${actual}' on this filter.`
      );
    }
    return options;
  };
};

/** A filter's debounced `loadOptions`, kept alongside the inputs it was built from. */
interface DebouncedLoadOptions {
  debounceMs: number;
  loadOptions: LoadOptions;
  wrapped: LoadOptions;
}

type LoadOptions = (search: string, signal: AbortSignal) => Promise<FilterOption[]>;

/** Per-key store of {@link cachedDebouncedLoadOptions} entries, owned by the hook. */
export type DebouncedLoadOptionsCache = Record<string, DebouncedLoadOptions>;

/**
 * One async filter's debounced `loadOptions`, memoized in `cache` by key so the
 * pending timer and its queued callers survive a re-render. Rebuilt only when
 * the filter's own `loadOptions` identity or `searchDebounceMs` changes.
 */
export const cachedDebouncedLoadOptions = (
  cache: DebouncedLoadOptionsCache,
  key: string,
  config: AsyncMultiSelectFilterConfig | AsyncSelectFilterConfig,
  warned: Set<string>
): LoadOptions => {
  const debounceMs = config.searchDebounceMs ?? DEFAULT_ASYNC_DEBOUNCE_MS;
  const cached = cache[key];
  if (cached && cached.loadOptions === config.loadOptions && cached.debounceMs === debounceMs) {
    return cached.wrapped;
  }
  const wrapped = debounceAsync(withValueTypeCheck(key, config, warned), debounceMs);
  cache[key] = { debounceMs, loadOptions: config.loadOptions, wrapped };
  return wrapped;
};

/** The extra fields an `asyncSelect` filter exposes. */
interface AsyncSingleFields {
  selectedOption: SelectedOption | null;
  onSelectOption: (option: FilterOption | null) => void;
}

/** The extra fields an `asyncMultiSelect` filter exposes. */
interface AsyncMultiFields {
  selectedOptions: SelectedOption[];
  onSetOptions: (options: FilterOption[]) => void;
  onToggleOption: (option: FilterOption) => void;
}

/** Async filters' `selectedOption(s)` + option-aware setters (`onSelectOption`, `onToggleOption`, …). */
export const resolveAsyncFields = (
  kind: 'multi' | 'single',
  key: string,
  mode: FilterCommitMode,
  draft: CommittedValue,
  schedule: ScheduleChange
): AsyncMultiFields | AsyncSingleFields => {
  if (kind === 'single') {
    const value = draft.value as FilterPrimitive | null;
    const label = draft.labels as string | null;
    return {
      selectedOption: value === null ? null : ({ value, label } as SelectedOption),
      onSelectOption: (option) => {
        schedule({ key, mode, value: option?.value ?? null, labels: option?.label ?? null });
      }
    };
  }

  const selected = (draft.value ?? []) as FilterPrimitive[];
  const labels = (draft.labels ?? []) as string[];
  // An empty selection clears both params rather than writing `[]`.
  const scheduleSelection = (values: FilterPrimitive[], nextLabels: string[]) => {
    schedule({
      key,
      mode,
      value: values.length ? (values as ParamValue) : null,
      labels: values.length ? nextLabels : null
    });
  };

  return {
    selectedOptions: selected.map<SelectedOption>((value, index) => ({
      value,
      label: labels[index] ?? null
    })),
    onSetOptions: (options) => {
      scheduleSelection(
        options.map((option) => option.value),
        options.map((option) => option.label)
      );
    },
    onToggleOption: (option) => {
      const index = selected.indexOf(option.value);
      const nextValues = [...selected];
      // Fall back to the stringified value for any item missing its sidecar label.
      const nextLabels = selected.map((value, i) => labels[i] ?? String(value));
      if (index === -1) {
        nextValues.push(option.value);
        nextLabels.push(option.label);
      } else {
        nextValues.splice(index, 1);
        nextLabels.splice(index, 1);
      }
      scheduleSelection(nextValues, nextLabels);
    }
  };
};

/** The extra fields a static (non-async) choice filter exposes. */
type StaticSelectFields =
  | Record<string, never>
  | { selectedOption: FilterOption | null }
  | { selectedOptions: FilterOption[] };

/** Static choice filters' `selectedOption(s)` — the full option object(s) resolved from `options`. */
export const resolveStaticSelectFields = (
  config: FilterConfig,
  draftValue: ParamValue
): StaticSelectFields => {
  if (config.type === 'select') {
    return { selectedOption: config.options.find((option) => option.value === draftValue) ?? null };
  }
  if (config.type === 'multiSelect') {
    const selected = (draftValue ?? []) as FilterPrimitive[];
    return {
      selectedOptions: config.options.filter((option) => selected.includes(option.value))
    };
  }
  return {};
};
