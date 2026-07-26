import type { ResolvedFilter } from '@mbsatimov/use-filters';
import type { ReactNode } from 'react';

import { fromDateValue } from '@mbsatimov/use-filters';
import { format } from 'date-fns';

const chip = (content: ReactNode, truncate = false) =>
  truncate ? <span className='block max-w-40 truncate'>{content}</span> : content;

const numberFormat = new Intl.NumberFormat('en-US');

/**
 * The value preview shown inside an active filter chip — one place that maps a
 * resolved filter to what the user sees on the chip. Returns `null` when the
 * filter has no value. `text` renders inline, not as a chip, so it has no case.
 */
export const summarize = (filter: ResolvedFilter): ReactNode => {
  switch (filter.type) {
    case 'select': {
      return filter.selectedOption ? chip(filter.selectedOption.label, true) : null;
    }
    case 'multiSelect': {
      const selected = filter.selectedOptions;
      if (selected.length === 0) return null;
      if (selected.length > 1) return `${selected[0].label} +${selected.length - 1}`;
      return chip(selected[0].label, true);
    }
    case 'asyncSelect': {
      const selected = filter.selectedOption;
      return selected ? chip(selected.label ?? String(selected.value), true) : null;
    }
    case 'asyncMultiSelect': {
      const selected = filter.selectedOptions;
      if (selected.length === 0) return null;
      if (selected.length > 2) return chip(`${selected.length} selected`);
      return selected.map((option) => (
        <span key={String(option.value)}>{chip(option.label ?? String(option.value), true)}</span>
      ));
    }
    case 'boolean': {
      if (filter.value === null) return null;
      return chip(filter.value ? (filter.trueLabel ?? 'Yes') : (filter.falseLabel ?? 'No'));
    }
    case 'number': {
      return filter.value === null ? null : numberFormat.format(filter.value);
    }
    case 'numberRange': {
      if (filter.value === null) return null;
      const [min, max] = filter.value;
      return `${numberFormat.format(min)} – ${numberFormat.format(max)}`;
    }
    case 'date': {
      const date = fromDateValue(filter.value);
      return date ? <span>{format(date, 'MMM dd, yyyy')}</span> : null;
    }
    case 'dateRange': {
      const [fromValue, toValue] = filter.value ?? ['', ''];
      const from = fromDateValue(fromValue);
      const to = fromDateValue(toValue);
      if (!from && !to) return null;
      return (
        <span>
          {from ? format(from, 'dd.MM.yyyy') : '…'} – {to ? format(to, 'dd.MM.yyyy') : '…'}
        </span>
      );
    }
    case 'time': {
      return filter.value;
    }
    case 'timeRange': {
      if (filter.value === null) return null;
      const [from, to] = filter.value;
      return `${from || '…'} – ${to || '…'}`;
    }
    case 'tags': {
      const tags = filter.value ?? [];
      if (tags.length === 0) return null;
      if (tags.length > 2) return chip(`${tags.length} tags`);
      return chip(tags.join(', '), true);
    }
    default:
      return null; // text renders inline, not as a chip
  }
};
