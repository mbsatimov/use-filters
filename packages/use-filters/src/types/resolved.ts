import type {
  AsyncMultiSelectFilterConfig,
  AsyncSelectFilterConfig,
  FilterCommitMode,
  FilterConfig,
  FilterOption,
  FilterType,
  MultiSelectFilterConfig,
  SelectFilterConfig
} from './config';
import type { FilterPrimitive, ParamValue } from './primitives';
import type { FilterValue } from './values';

/**
 * A selected entity as reconstructed from the URL: the value plus its label
 * sidecar (`<key>_label`). `label` is `null` when the sidecar is missing —
 * e.g. a hand-edited URL — and the UI falls back to the raw value.
 */
export interface SelectedOption<V extends FilterPrimitive = FilterPrimitive> {
  label: string | null;
  value: V;
}

/**
 * Extra handlers/state async filters get. The handlers use **method syntax**
 * on purpose: method params are checked bivariantly, which is what keeps a
 * narrow resolved filter assignable to the wide `ResolvedFilter` union (the
 * unsafe direction stays rejected via covariant `value`/`selectedOption`).
 * Hence the targeted `method-signature-style` disables.
 */
type AsyncResolvedExtras<C> =
  C extends AsyncSelectFilterConfig<infer V>
    ? {
        /** Select an option (or `null` to clear) — writes value and label sidecar together. */
        // eslint-disable-next-line ts/method-signature-style -- intentional bivariance, see doc comment
        onSelectOption(option: FilterOption<V> | null): void;
        /** Current selection paired with its URL-stored label. */
        selectedOption: SelectedOption<V> | null;
      }
    : C extends AsyncMultiSelectFilterConfig<infer V>
      ? {
          /** Replace the whole selection at once (batch apply from the mobile sheet). */
          // eslint-disable-next-line ts/method-signature-style -- intentional bivariance, see doc comment
          onSetOptions(options: FilterOption<V>[]): void;
          /** Toggle an option in/out of the selection — keeps value/label arrays paired. */
          // eslint-disable-next-line ts/method-signature-style -- intentional bivariance, see doc comment
          onToggleOption(option: FilterOption<V>): void;
          /** Current selections paired with their URL-stored labels. */
          selectedOptions: SelectedOption<V>[];
        }
      : unknown;

/**
 * Read-side convenience for static (non-async) choice filters: the full
 * selected option object(s) — value + label (+ count, custom `meta`) — resolved
 * from the config's `options`. No URL label sidecar is needed because static options are
 * always in memory; this just spares callers a value→option lookup.
 */
type StaticSelectExtras<C> =
  C extends SelectFilterConfig<infer V>
    ? {
        /** The full selected option, or `null` when nothing is chosen. */
        selectedOption: FilterOption<V> | null;
      }
    : C extends MultiSelectFilterConfig<infer V>
      ? {
          /** The full selected options, in the config's option order. */
          selectedOptions: FilterOption<V>[];
        }
      : unknown;

/**
 * A single filter as your UI receives it: everything from the config plus its
 * live `key`, current `value`, and ready-made handlers. An element of the hook's
 * `filters` array and a value in `filterMap`. Choice filters also expose the
 * resolved `selectedOption(s)`; async ones add option-aware setters.
 */
export type ResolvedFilter<C extends FilterConfig = FilterConfig> = C extends unknown
  ? Omit<C, 'commit'> &
      AsyncResolvedExtras<C> &
      StaticSelectExtras<C> & {
        /** Commit this filter's pending change now, bypassing `commit`. No-op when not `isDirty`. */
        apply: () => void;
        /** Discard this filter's pending change, reverting to `committedValue`. No-op when not `isDirty`. */
        cancel: () => void;
        /** This filter's *effective* `commit` mode (per-filter config, else the resolved default). */
        commit: FilterCommitMode;
        /** The committed (URL) value, independent of any pending draft. Equals `value` unless `isDirty`. */
        committedValue: FilterValue<C>;
        /** Debounce delay (ms) when `commit` is `{ debounce }`, else `null`. */
        debounceMs: number | null;
        /** `true` when `commit` resolves to `{ debounce }`. */
        isDebounced: boolean;
        /** `true` while a change hasn't reached the URL yet (debounce pending, or manual awaiting `apply()`). */
        isDirty: boolean;
        /**
         * `true` when this filter's **committed** value is active (differs from
         * default, or non-empty). Per-filter — doesn't exclude `hidden`. Use
         * `isFilteredDraft` for UI reacting to the draft before commit.
         */
        isFiltered: boolean;
        /** Like `isFiltered`, but against the **draft** value. Equals `isFiltered` unless `isDirty`. */
        isFilteredDraft: boolean;
        /** `true` when `commit` resolves to `'instant'` (the default). */
        isInstant: boolean;
        /** `true` when `commit` resolves to `'manual'`. */
        isManual: boolean;
        /** Reset to default **immediately**, bypassing `commit` (the mode-bypassing counterpart to `reset`). */
        instantReset: () => void;
        key: string;
        // Method syntax on purpose — bivariant params keep a narrow resolved
        // filter assignable to the wide `ResolvedFilter` union (see `AsyncResolvedExtras`).
        // `| null` so a defaulted filter can still be cleared back to its default.
        // eslint-disable-next-line ts/method-signature-style -- intentional bivariance
        onChange(value: FilterValue<C> | null): void;
        /** Reset to default, **respecting** `commit` (stays a draft on manual/debounced filters). */
        reset: () => void;
        value: FilterValue<C>;
      }
  : never;

/** Narrow a `ResolvedFilter` to one concrete kind, e.g. `ResolvedFilterOf<'select'>`. */
export type ResolvedFilterOf<T extends FilterType> = Extract<ResolvedFilter, { type: T }>;

/**
 * The kind-independent fields every resolved filter carries — the contract the
 * `resolveFilter` site (use-filters.ts) is compile-checked against. Kind-specific
 * extras are assembled separately. {@link ResolvedFilter} is the public per-kind
 * view; a type test ties them so they can't drift. Internal (not re-exported).
 */
export interface ResolvedFilterBase {
  commit: FilterCommitMode;
  committedValue: ParamValue;
  debounceMs: number | null;
  isDebounced: boolean;
  isDirty: boolean;
  isFiltered: boolean;
  isFilteredDraft: boolean;
  isInstant: boolean;
  isManual: boolean;
  key: string;
  value: ParamValue;
  apply: () => void;
  cancel: () => void;
  instantReset: () => void;
  // Method syntax on purpose — bivariant params keep each variant's narrowly
  // typed `onChange` assignable to this base (see {@link AsyncResolvedExtras}).
  // eslint-disable-next-line ts/method-signature-style -- intentional bivariance, see comment
  onChange(value: ParamValue): void;
  reset: () => void;
}

/**
 * The `filterMap` shape: each key maps to *its own* config's `ResolvedFilter`
 * variant (a plain `Record<keyof T, ResolvedFilter>` would collapse `onChange`'s
 * param to `null` — union functions are contravariant on params).
 *
 * Bound to plain `Record<string, FilterConfig | undefined>`, NOT `FiltersFor<P>`:
 * a conditional type as a generic bound referencing a sibling generic (`P`)
 * sends the checker into a multi-GB blowup, even fully concrete. `T` is always
 * structurally compatible with this looser bound.
 */
export type FilterMapOf<T extends Record<string, FilterConfig | undefined>> = {
  [K in keyof T]-?: ResolvedFilter<NonNullable<T[K]>>;
};
