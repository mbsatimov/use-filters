import type { ResolvedFilter } from '@mbsatimov/use-filters';

const numberFormat = new Intl.NumberFormat('en-US');

/**
 * The short label an active facet shows on its mobile chip. Reads
 * `committedValue` — what is really narrowing the data — so a staged drawer
 * edit doesn't change the chips until it is applied. Returns `null` while the
 * filter is inactive.
 */
export function summarizeFacet(filter: ResolvedFilter): string | null {
  switch (filter.type) {
    case 'select': {
      const value = filter.committedValue;
      if (value === null) return null;
      return filter.options.find((option) => option.value === value)?.label ?? String(value);
    }
    case 'multiSelect': {
      const values = filter.committedValue;
      if (!values?.length) return null;
      const first = filter.options.find((option) => option.value === values[0])?.label;
      return values.length === 1 ? (first ?? null) : `${values.length} selected`;
    }
    case 'asyncSelect':
      return filter.selectedOption?.label ?? null;
    case 'asyncMultiSelect': {
      const selected = filter.selectedOptions;
      if (selected.length === 0) return null;
      return selected.length === 1 ? selected[0].label : `${selected.length} selected`;
    }
    case 'boolean': {
      const value = filter.committedValue;
      if (value === null) return null;
      return value ? (filter.trueLabel ?? 'Yes') : (filter.falseLabel ?? 'No');
    }
    case 'number': {
      const value = filter.committedValue;
      return value === null ? null : numberFormat.format(value);
    }
    case 'numberRange': {
      const range = filter.committedValue;
      if (range === null) return null;
      return `${numberFormat.format(range[0])}–${numberFormat.format(range[1])}`;
    }
    case 'date':
    case 'time':
      return filter.committedValue;
    case 'dateRange':
    case 'timeRange': {
      const range = filter.committedValue;
      if (range === null) return null;
      return `${range[0] || '…'} – ${range[1] || '…'}`;
    }
    case 'tags': {
      const tags = filter.committedValue;
      if (!tags?.length) return null;
      return tags.length === 1 ? tags[0] : `${tags.length} tags`;
    }
    case 'text':
      return filter.committedValue;
    default:
      return null;
  }
}
