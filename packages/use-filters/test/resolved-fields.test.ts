import { describe, expect, it, vi } from 'vitest';

import type { ScheduledChange } from '../src/resolved-fields';
import type { FilterOption, LoadOptions, OptionsCursor } from '../src/types';

import { f } from '../src/builders';
import {
  cachedLoadOptions,
  defaultValueOf,
  differsFromDefault,
  readCommitted,
  resolveAsyncFields,
  resolveStaticSelectFields
} from '../src/resolved-fields';

const statusOptions: FilterOption<string>[] = [
  { label: 'Open', value: 'open' },
  { label: 'Closed', value: 'closed' }
];

describe('defaultValueOf', () => {
  it('returns the config default when there is one', () => {
    expect(defaultValueOf(f.number({ label: 'Per page', defaultValue: 25 }))).toBe(25);
  });

  it('normalizes a missing default to null', () => {
    expect(defaultValueOf(f.text({ label: 'Search' }))).toBeNull();
  });
});

describe('differsFromDefault', () => {
  it('compares against the default when the config has one', () => {
    const config = f.text({ label: 'Search', defaultValue: 'a' });
    expect(differsFromDefault(config, 'a')).toBe(false);
    expect(differsFromDefault(config, 'b')).toBe(true);
  });

  it('compares array defaults by value, not identity', () => {
    const config = f.tags({ label: 'Tags', defaultValue: ['a', 'b'] });
    expect(differsFromDefault(config, ['a', 'b'])).toBe(false);
    expect(differsFromDefault(config, ['a'])).toBe(true);
  });

  it('falls back to "is non-empty" with no default', () => {
    const config = f.text({ label: 'Search' });
    expect(differsFromDefault(config, null)).toBe(false);
    expect(differsFromDefault(config, '')).toBe(false);
    expect(differsFromDefault(config, 'x')).toBe(true);
  });
});

describe('readCommitted', () => {
  it('reads the value and its label sidecar', () => {
    expect(readCommitted({ customer: 7, customer_label: 'Ada' }, 'customer')).toEqual({
      value: 7,
      labels: 'Ada'
    });
  });

  it('normalizes a missing value and sidecar to null', () => {
    expect(readCommitted({}, 'customer')).toEqual({ value: null, labels: null });
  });
});

describe('resolveStaticSelectFields', () => {
  it('resolves the full option for a select', () => {
    const config = f.select({ label: 'Status', valueType: 'string', options: statusOptions });
    expect(resolveStaticSelectFields(config, 'closed')).toEqual({
      selectedOption: { label: 'Closed', value: 'closed' }
    });
    expect(resolveStaticSelectFields(config, 'missing')).toEqual({ selectedOption: null });
  });

  it('resolves options in config order for a multiSelect', () => {
    const config = f.multiSelect({ label: 'Status', valueType: 'string', options: statusOptions });
    expect(resolveStaticSelectFields(config, ['closed', 'open'])).toEqual({
      selectedOptions: statusOptions
    });
  });

  it('adds nothing for a non-choice filter', () => {
    expect(resolveStaticSelectFields(f.text({ label: 'Search' }), 'x')).toEqual({});
  });
});

/** Capture what `resolveAsyncFields` hands to `schedule`. */
const captureSchedule = () => {
  const calls: ScheduledChange[] = [];
  return { calls, schedule: (change: ScheduledChange) => calls.push(change) };
};

describe('resolveAsyncFields — single', () => {
  it('pairs the draft value with its stored label', () => {
    const { schedule } = captureSchedule();
    const fields = resolveAsyncFields(
      'single',
      'customer',
      'instant',
      { value: 7, labels: 'Ada' },
      schedule
    );
    expect(fields).toMatchObject({ selectedOption: { value: 7, label: 'Ada' } });
  });

  it('reports a null selection when nothing is chosen', () => {
    const { schedule } = captureSchedule();
    const fields = resolveAsyncFields(
      'single',
      'customer',
      'instant',
      { value: null, labels: null },
      schedule
    );
    expect(fields).toMatchObject({ selectedOption: null });
  });

  it('writes value and label together, and clears both on null', () => {
    const { calls, schedule } = captureSchedule();
    const fields = resolveAsyncFields(
      'single',
      'customer',
      'instant',
      { value: null, labels: null },
      schedule
    ) as { onSelectOption: (option: FilterOption | null) => void };

    fields.onSelectOption({ label: 'Ada', value: 7 });
    expect(calls[0]).toMatchObject({ key: 'customer', value: 7, labels: 'Ada' });

    fields.onSelectOption(null);
    expect(calls[1]).toMatchObject({ key: 'customer', value: null, labels: null });
  });
});

describe('resolveAsyncFields — multi', () => {
  const build = (value: unknown, labels: unknown) => {
    const { calls, schedule } = captureSchedule();
    const fields = resolveAsyncFields(
      'multi',
      'tags',
      'instant',
      { value: value as never, labels: labels as never },
      schedule
    ) as {
      selectedOptions: { label: string | null; value: unknown }[];
      onSetOptions: (options: FilterOption[]) => void;
      onToggleOption: (option: FilterOption) => void;
    };
    return { calls, fields };
  };

  it('pairs each value with its label by index', () => {
    const { fields } = build([1, 2], ['Ada', 'Grace']);
    expect(fields.selectedOptions).toEqual([
      { value: 1, label: 'Ada' },
      { value: 2, label: 'Grace' }
    ]);
  });

  it('leaves a label null when its sidecar entry is missing', () => {
    const { fields } = build([1, 2], ['Ada']);
    expect(fields.selectedOptions[1]).toEqual({ value: 2, label: null });
  });

  it('adds an option on toggle, keeping values and labels paired', () => {
    const { calls, fields } = build([1], ['Ada']);
    fields.onToggleOption({ label: 'Grace', value: 2 });
    expect(calls[0]).toMatchObject({ value: [1, 2], labels: ['Ada', 'Grace'] });
  });

  it('removes an option on toggle, dropping its label too', () => {
    const { calls, fields } = build([1, 2], ['Ada', 'Grace']);
    fields.onToggleOption({ label: 'Ada', value: 1 });
    expect(calls[0]).toMatchObject({ value: [2], labels: ['Grace'] });
  });

  it('clears both params when the last option is toggled off', () => {
    const { calls, fields } = build([1], ['Ada']);
    fields.onToggleOption({ label: 'Ada', value: 1 });
    expect(calls[0]).toMatchObject({ value: null, labels: null });
  });

  it('replaces the whole selection with onSetOptions', () => {
    const { calls, fields } = build([1], ['Ada']);
    fields.onSetOptions([
      { label: 'Grace', value: 2 },
      { label: 'Alan', value: 3 }
    ]);
    expect(calls[0]).toMatchObject({ value: [2, 3], labels: ['Grace', 'Alan'] });
  });

  it('clears both params when set to an empty selection', () => {
    const { calls, fields } = build([1], ['Ada']);
    fields.onSetOptions([]);
    expect(calls[0]).toMatchObject({ value: null, labels: null });
  });
});

describe('cachedLoadOptions', () => {
  const configWith = (loadOptions: LoadOptions<number>) =>
    f.asyncSelect({ label: 'Customer', valueType: 'number', loadOptions });
  const context = (cursor: OptionsCursor | null = null) => ({
    search: 'a',
    signal: new AbortController().signal,
    cursor
  });

  it('returns the same wrapper while loadOptions is unchanged', () => {
    const cache = {};
    const config = configWith(async () => ({ options: [] }));
    const first = cachedLoadOptions(cache, 'customer', config, new Set());
    const second = cachedLoadOptions(cache, 'customer', config, new Set());
    expect(second).toBe(first);
  });

  it('stays the same when loadOptions identity changes, and calls the latest one', async () => {
    const cache = {};
    const oldLoader = vi.fn(async () => ({ options: [] }));
    const newLoader = vi.fn(async () => ({ options: [] }));
    const first = cachedLoadOptions(cache, 'customer', configWith(oldLoader), new Set());
    const second = cachedLoadOptions(cache, 'customer', configWith(newLoader), new Set());
    expect(second).toBe(first);

    await first(context());
    expect(oldLoader).not.toHaveBeenCalled();
    expect(newLoader).toHaveBeenCalledOnce();
  });

  it('keys the cache per filter', () => {
    const cache = {};
    const loadOptions = async () => ({ options: [] });
    const a = cachedLoadOptions(cache, 'a', configWith(loadOptions), new Set());
    const b = cachedLoadOptions(cache, 'b', configWith(loadOptions), new Set());
    expect(b).not.toBe(a);
  });

  it('calls loadOptions right away with the context, and returns its page untouched', async () => {
    const page = { options: [{ label: 'Ada', value: 1 }], nextCursor: 2 };
    const loadOptions = vi.fn(async () => page);
    const wrapped = cachedLoadOptions({}, 'customer', configWith(loadOptions), new Set());
    const ctx = context(1);

    await expect(wrapped(ctx)).resolves.toBe(page);
    expect(loadOptions).toHaveBeenCalledOnce();
    expect(loadOptions).toHaveBeenCalledWith(ctx);
  });

  it('never merges calls: each cursor gets its own request', async () => {
    const loadOptions = vi.fn(async ({ cursor }: { cursor: OptionsCursor | null }) => ({
      options: [{ label: `page ${cursor ?? 1}`, value: Number(cursor ?? 1) }]
    }));
    const wrapped = cachedLoadOptions({}, 'customer', configWith(loadOptions), new Set());

    const [first, second] = await Promise.all([wrapped(context()), wrapped(context(2))]);

    expect(loadOptions).toHaveBeenCalledTimes(2);
    expect(first.options[0].label).toBe('page 1');
    expect(second.options[0].label).toBe('page 2');
  });

  it('warns once when a page contradicts valueType', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const loadOptions = async () => ({ options: [{ label: 'Acme', value: 'acme' }] });
    const wrapped = cachedLoadOptions(
      {},
      'customer',
      configWith(loadOptions as unknown as LoadOptions<number>),
      new Set()
    );

    await wrapped(context());
    await wrapped(context(2));

    expect(warn).toHaveBeenCalledOnce();
    expect(warn.mock.calls[0][0]).toContain("valueType is 'number'");
    warn.mockRestore();
  });
});
