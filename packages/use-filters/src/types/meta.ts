/**
 * Fields shared by every filter kind's `meta` — augment this for a hint that
 * makes sense everywhere (e.g. a shared layout `variant`). Every per-kind meta
 * interface below (`SelectFilterMeta`, `NumberFilterMeta`, …) extends this one,
 * so an augmentation here shows up on all of them.
 *
 * @example
 * declare module '@mbsatimov/use-filters' {
 *   interface FilterMeta {
 *     variant?: 'flex' | 'list';
 *   }
 * }
 */
export interface FilterMeta {}

/**
 * Per-kind `meta` extension points — augment only the kinds you need (like
 * TanStack's `ColumnMeta`), each checked against its own interface.
 *
 * @example
 * declare module '@mbsatimov/use-filters' {
 *   interface SelectFilterMeta { group?: 'primary' | 'advanced' }
 * }
 */
export interface TextFilterMeta extends FilterMeta {}
export interface NumberFilterMeta extends FilterMeta {}
export interface NumberRangeFilterMeta extends FilterMeta {}
export interface BooleanFilterMeta extends FilterMeta {}
export interface DateFilterMeta extends FilterMeta {}
export interface DateRangeFilterMeta extends FilterMeta {}
export interface TimeFilterMeta extends FilterMeta {}
export interface TimeRangeFilterMeta extends FilterMeta {}
export interface SelectFilterMeta extends FilterMeta {}
export interface AsyncSelectFilterMeta extends FilterMeta {}
export interface AsyncMultiSelectFilterMeta extends FilterMeta {}
export interface MultiSelectFilterMeta extends FilterMeta {}
export interface TagsFilterMeta extends FilterMeta {}

/**
 * Extension point for per-option UI hints (`FilterOption.meta`) — augment for
 * an icon, color swatch, etc. The option counterpart to {@link FilterMeta}.
 */
export interface FilterOptionMeta {}

/**
 * Extension point for `useFilters`' hook-level `meta` — whole-set UI hints.
 * Augment like {@link FilterMeta}.
 */
export interface FiltersMeta {}
