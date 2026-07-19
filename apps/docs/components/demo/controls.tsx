'use client';

import { type ReactNode } from 'react';

/** A labeled row wrapping any control. */
export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className='flex flex-col gap-1.5'>
      <span className='text-xs font-medium text-fd-muted-foreground'>{label}</span>
      {children}
    </label>
  );
}

const inputClass =
  'h-9 w-full rounded-lg border border-fd-border bg-fd-background px-3 text-sm outline-none transition-colors focus-visible:border-fd-primary';

export function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input className={inputClass} {...props} />;
}

export function SelectInput({
  value,
  onChange,
  options,
  placeholder = '— any —'
}: {
  value: string;
  onChange: (value: string) => void;
  options: { label: string; value: string }[];
  placeholder?: string;
}) {
  return (
    <select className={inputClass} value={value} onChange={(e) => onChange(e.target.value)}>
      <option value=''>{placeholder}</option>
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

/** A pill toggle group (single or multi). */
export function ToggleGroup({
  options,
  selected,
  onToggle
}: {
  options: { label: string; value: string }[];
  selected: string[];
  onToggle: (value: string) => void;
}) {
  return (
    <div className='flex flex-wrap gap-1.5'>
      {options.map((o) => {
        const on = selected.includes(o.value);
        return (
          <button
            key={o.value}
            type='button'
            onClick={() => onToggle(o.value)}
            className={
              'rounded-full border px-3 py-1 text-xs font-medium transition-colors ' +
              (on
                ? 'border-fd-primary bg-fd-primary text-fd-primary-foreground'
                : 'border-fd-border text-fd-muted-foreground hover:bg-fd-accent')
            }
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

export function Button({
  children,
  variant = 'primary',
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'outline' }) {
  return (
    <button
      className={
        'h-9 rounded-lg px-4 text-sm font-medium transition-colors disabled:pointer-events-none disabled:opacity-50 ' +
        (variant === 'primary'
          ? 'bg-fd-primary text-fd-primary-foreground hover:opacity-90'
          : 'border border-fd-border hover:bg-fd-accent')
      }
      {...props}
    >
      {children}
    </button>
  );
}

/** Read-only JSON preview of an object (e.g. `params`). */
export function JsonPreview({ label = 'params', value }: { label?: string; value: unknown }) {
  return (
    <div className='rounded-lg border border-fd-border bg-fd-muted/30'>
      <div className='border-b border-fd-border px-3 py-1.5 font-mono text-xs text-fd-muted-foreground'>
        {label}
      </div>
      <pre className='overflow-x-auto p-3 font-mono text-xs leading-relaxed'>
        {JSON.stringify(value, null, 2)}
      </pre>
    </div>
  );
}
