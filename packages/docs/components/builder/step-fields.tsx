'use client';

import { DATE_TIME_FORMAT } from '@mbsatimov/use-filters';
import { AlertCircle } from 'lucide-react';
import { useState } from 'react';

import type { ProjectConfig } from '@/lib/builder/types';

import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { DEFAULTS } from '@/lib/builder/types';
import {
  sanitizeSeparator,
  validateDateFormat,
  validateDateTimeFormat,
  validateKey,
  validateSeparator
} from '@/lib/builder/validate';
import { cn } from '@/lib/utils';

/**
 * The free-text answers.
 *
 * These are real components rather than inline JSX so each can hold its own
 * draft: a half-typed key or date pattern would otherwise be pushed into the
 * config, and the step's live example would flicker through invalid states as
 * you type. Nothing reaches the config until it validates.
 */

const Invalid = ({ children }: { children: string }) => (
  <p className='text-destructive flex items-start gap-1.5 text-xs'>
    <AlertCircle className='mt-0.5 size-3 shrink-0' />
    {children}
  </p>
);

const Hint = ({ children }: { children: React.ReactNode }) => (
  <p className='text-muted-foreground text-xs leading-relaxed'>{children}</p>
);

const fieldset = 'flex flex-col gap-2 rounded-lg border border-dashed p-3';
const legend = 'text-muted-foreground text-xs font-medium';

/** Step 2 — the pagination keys, when none of the presets fit. */
export const PaginationKeysField = ({
  config,
  set
}: {
  config: ProjectConfig;
  set: (patch: Partial<ProjectConfig>) => void;
}) => {
  const [page, setPage] = useState(config.pageKey);
  const [perPage, setPerPage] = useState(config.perPageKey);

  // A preset click updates the config behind our back; follow it.
  const [seen, setSeen] = useState({ page: config.pageKey, perPage: config.perPageKey });
  if (seen.page !== config.pageKey || seen.perPage !== config.perPageKey) {
    setSeen({ page: config.pageKey, perPage: config.perPageKey });
    setPage(config.pageKey);
    setPerPage(config.perPageKey);
  }

  const pageError = validateKey(page);
  const perPageError = validateKey(perPage);

  return (
    <div className={fieldset}>
      <span className={legend}>Or write your own</span>
      <div className='flex flex-wrap items-start gap-3'>
        <label className='flex min-w-0 flex-1 flex-col gap-1'>
          <span className='text-muted-foreground text-xs'>Page param</span>
          <Input
            aria-invalid={!!pageError}
            className='font-mono'
            value={page}
            onChange={(event) => {
              const next = event.target.value.trim();
              setPage(next);
              if (!validateKey(next)) set({ pageKey: next });
            }}
          />
        </label>
        <label className='flex min-w-0 flex-1 flex-col gap-1'>
          <span className='text-muted-foreground text-xs'>Page size param</span>
          <Input
            aria-invalid={!!perPageError}
            className='font-mono'
            value={perPage}
            onChange={(event) => {
              const next = event.target.value.trim();
              setPerPage(next);
              if (!validateKey(next)) set({ perPageKey: next });
            }}
          />
        </label>
      </div>
      {pageError && <Invalid>{`Page param: ${pageError}`}</Invalid>}
      {perPageError && <Invalid>{`Page size param: ${perPageError}`}</Invalid>}
    </div>
  );
};

/** Step 3 — any page size, when the preset chips do not cover it. */
export const PerPageField = ({
  config,
  set
}: {
  config: ProjectConfig;
  set: (patch: Partial<ProjectConfig>) => void;
}) => {
  const [draft, setDraft] = useState(String(config.defaultPerPage));

  const [seen, setSeen] = useState(config.defaultPerPage);
  if (seen !== config.defaultPerPage) {
    setSeen(config.defaultPerPage);
    setDraft(String(config.defaultPerPage));
  }

  const parsed = Number(draft);
  const error =
    draft.trim() === ''
      ? 'Required'
      : !Number.isInteger(parsed)
        ? 'Whole numbers only'
        : parsed < 1
          ? 'Must be at least 1'
          : parsed > 1000
            ? 'Keep it under 1000'
            : undefined;

  return (
    <div className={fieldset}>
      <span className={legend}>Or write your own</span>
      <label className='flex items-center gap-2'>
        <Input
          aria-invalid={!!error}
          aria-label='Rows per page'
          className='w-24'
          inputMode='numeric'
          value={draft}
          onChange={(event) => {
            const next = event.target.value;
            setDraft(next);
            const value = Number(next);
            if (Number.isInteger(value) && value >= 1 && value <= 1000) {
              set({ defaultPerPage: value });
            }
          }}
        />
        <span className='text-muted-foreground text-sm'>rows per page</span>
      </label>
      {error && <Invalid>{error}</Invalid>}
    </div>
  );
};

/** Step 5 — the separator, only shown once arrays are being joined. */
const SEPARATOR_PRESETS = [',', '|', ';', '+'];

export const SeparatorField = ({
  config,
  set
}: {
  config: ProjectConfig;
  set: (patch: Partial<ProjectConfig>) => void;
}) => {
  const [draft, setDraft] = useState(config.arraySeparator);
  const error = validateSeparator(draft);

  return (
    <div className={fieldset}>
      <span className={legend}>Separator</span>
      <div className='flex flex-wrap items-center gap-2'>
        {SEPARATOR_PRESETS.map((preset) => (
          <button
            key={preset}
            className={cn(
              'size-8 rounded-md border font-mono text-sm transition-colors',
              config.arraySeparator === preset ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'
            )}
            type='button'
            onClick={() => {
              setDraft(preset);
              set({ arraySeparator: preset });
            }}
          >
            {preset}
          </button>
        ))}
        <Input
          aria-invalid={!!error}
          aria-label='Custom separator'
          className='w-20 text-center font-mono'
          maxLength={3}
          value={draft}
          onChange={(event) => {
            // Filter as they type — a letter here would split values mid-word.
            const next = sanitizeSeparator(event.target.value);
            setDraft(next);
            if (!validateSeparator(next)) set({ arraySeparator: next });
          }}
        />
      </div>
      {error ? (
        <Invalid>{error}</Invalid>
      ) : (
        <Hint>Punctuation only — a letter or digit could appear inside a value.</Hint>
      )}
    </div>
  );
};

/** Step 6 — any date-fns pattern, checked in both directions before it lands. */
export const DateFormatField = ({
  config,
  set
}: {
  config: ProjectConfig;
  set: (patch: Partial<ProjectConfig>) => void;
}) => {
  const [draft, setDraft] = useState(config.dateFormat || DEFAULTS.dateFormat);
  const error = validateDateFormat(draft);

  return (
    <div className={fieldset}>
      <span className={legend}>Custom pattern</span>
      <Input
        aria-invalid={!!error}
        aria-label='Date format'
        className='font-mono'
        placeholder='dd MMM yyyy'
        value={draft}
        onChange={(event) => {
          const next = event.target.value;
          setDraft(next);
          if (!validateDateFormat(next)) set({ dateFormat: next });
        }}
      />
      {error ? (
        <Invalid>{error}</Invalid>
      ) : (
        <Hint>
          Checked against date-fns, and round-tripped — a pattern that cannot be parsed back to the
          same day is rejected.
        </Hint>
      )}
    </div>
  );
};

/**
 * Step 6, second half — the pattern for `precision: 'datetime'` filters.
 * Off by default: most projects never declare one, so the question only
 * appears once switched on, seeded with the library's own pattern.
 */
export const DateTimeFormatField = ({
  config,
  set
}: {
  config: ProjectConfig;
  set: (patch: Partial<ProjectConfig>) => void;
}) => {
  const enabled = config.dateTimeFormat !== '';
  const [draft, setDraft] = useState(config.dateTimeFormat || DATE_TIME_FORMAT);
  const error = validateDateTimeFormat(draft);

  return (
    <div className={fieldset}>
      <label className='flex items-center gap-2'>
        <Switch
          checked={enabled}
          size='sm'
          onCheckedChange={(on) => {
            if (on) {
              setDraft(DATE_TIME_FORMAT);
              set({ dateTimeFormat: DATE_TIME_FORMAT });
            } else {
              set({ dateTimeFormat: '' });
            }
          }}
        />
        <span className='text-sm'>
          Also set the pattern for <code>precision: &apos;datetime&apos;</code> filters
        </span>
      </label>

      {enabled && (
        <>
          <Input
            aria-invalid={!!error}
            aria-label='Date-time format'
            className='font-mono'
            placeholder='dd.MM.yyyy HH:mm'
            value={draft}
            onChange={(event) => {
              const next = event.target.value;
              setDraft(next);
              if (!validateDateTimeFormat(next)) set({ dateTimeFormat: next });
            }}
          />
          {error ? (
            <Invalid>{error}</Invalid>
          ) : (
            <Hint>
              Round-tripped like the date pattern, and must keep the time of day — a date-only
              pattern here would read every datetime back as midnight.
            </Hint>
          )}
        </>
      )}
    </div>
  );
};
