'use client';

import { ArrowLeft, ArrowRight, Check, Copy, RotateCcw } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { useMemo, useState } from 'react';

import type { PackageManager, ProjectConfig } from '@/lib/builder/types';

import { CodePreview } from '@/components/builder/code-preview';
import { steps } from '@/components/builder/steps';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { generateFiles } from '@/lib/builder/codegen';
import { fromSearchParams } from '@/lib/builder/encode';
import { installCommand } from '@/lib/builder/install';
import { DEFAULTS, PACKAGE_MANAGERS } from '@/lib/builder/types';
import { getKit } from '@/lib/registry';
import { cn } from '@/lib/utils';

/**
 * The guided setup: one decision per screen, each with the library's default
 * already chosen, so pressing Next the whole way through is a valid answer and
 * lands on the same setup as `createFilters()` with no arguments.
 *
 * Every step shows what its choice changes — the URL, or the `params` object —
 * because these settings are otherwise invisible until you have already built
 * something on top of them.
 */
export const CreateFlow = () => {
  const search = useSearchParams();

  // A shared link reopens the flow on its configuration; edits then belong to
  // the user, so the URL is only read once.
  const [config, setConfig] = useState<ProjectConfig>(() =>
    search.size > 0 ? fromSearchParams(new URLSearchParams(search.toString())) : { ...DEFAULTS }
  );
  const [index, setIndex] = useState(0);

  const set = (patch: Partial<ProjectConfig>) => setConfig((prev) => ({ ...prev, ...patch }));

  const done = index >= steps.length;
  const step = steps[index];

  return (
    <div className='mx-auto w-full max-w-2xl'>
      <Progress current={index} total={steps.length} />

      {done ? (
        <Review
          config={config}
          onBack={() => setIndex(steps.length - 1)}
          onEdit={setIndex}
          onReset={() => {
            setConfig({ ...DEFAULTS });
            setIndex(0);
          }}
        />
      ) : (
        <div className='mt-8 flex flex-col gap-5'>
          <div>
            <p className='text-muted-foreground text-sm font-medium'>{step.title}</p>
            <h2 className='mt-1 text-xl font-semibold tracking-tight text-balance'>
              {step.question}
            </h2>
            <p className='text-muted-foreground mt-2 text-sm leading-relaxed'>{step.description}</p>
          </div>

          {step.renderOptions?.(config, set) ?? (
            <div className='flex flex-col gap-2'>
              {step.options(config).map((option) => {
                const selected = option.selected(config);
                return (
                  <button
                    key={option.value}
                    className={cn(
                      'flex items-start gap-3 rounded-lg border p-3 text-left transition-colors',
                      selected
                        ? 'border-primary bg-primary/5'
                        : 'hover:border-foreground/20 hover:bg-muted/50'
                    )}
                    type='button'
                    onClick={() => set(option.patch)}
                  >
                    <span
                      className={cn(
                        'mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full border',
                        selected && 'border-primary bg-primary text-primary-foreground'
                      )}
                    >
                      {selected && <Check className='size-2.5' />}
                    </span>
                    <span className='min-w-0 flex-1'>
                      <span className='flex flex-wrap items-center gap-2'>
                        <span className='text-sm font-medium'>{option.label}</span>
                        {option.badge && (
                          <Badge className='text-[10px]' variant='secondary'>
                            {option.badge}
                          </Badge>
                        )}
                      </span>
                      {option.hint && (
                        <span className='text-muted-foreground mt-0.5 block text-xs leading-relaxed'>
                          {option.hint}
                        </span>
                      )}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {step.extra?.(config, set)}

          {step.example(config)}

          <div className='flex items-center justify-between'>
            <Button
              disabled={index === 0}
              size='sm'
              variant='ghost'
              onClick={() => setIndex((value) => value - 1)}
            >
              <ArrowLeft className='size-3.5' /> Back
            </Button>
            <Button size='sm' onClick={() => setIndex((value) => value + 1)}>
              {index === steps.length - 1 ? 'Review' : 'Next'}
              <ArrowRight className='size-3.5' />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

const Progress = ({ current, total }: { current: number; total: number }) => (
  <div className='flex items-center gap-3'>
    <div className='bg-muted h-1 flex-1 overflow-hidden rounded-full'>
      <div
        className='bg-primary h-full rounded-full transition-all'
        style={{ width: `${Math.min((current / total) * 100, 100)}%` }}
      />
    </div>
    <span className='text-muted-foreground shrink-0 text-xs tabular-nums'>
      {Math.min(current + 1, total)} / {total}
    </span>
  </div>
);

/** The last screen: the recap, the command, and the files it writes. */
const Review = ({
  config,
  onBack,
  onEdit,
  onReset
}: {
  config: ProjectConfig;
  onBack: () => void;
  onEdit: (index: number) => void;
  onReset: () => void;
}) => {
  const [manager, setManager] = useState<PackageManager>('pnpm');
  const [copied, setCopied] = useState(false);
  const files = useMemo(() => generateFiles(config), [config]);
  const command = installCommand(config, manager);
  const kit = getKit(config.kit);

  const copy = () => {
    void navigator.clipboard.writeText(command).then(() => {
      setCopied(true);
      setTimeout(setCopied, 2000, false);
    });
  };

  return (
    <div className='mt-8 flex flex-col gap-6'>
      <div>
        <h2 className='text-xl font-semibold tracking-tight'>Your setup</h2>
        <p className='text-muted-foreground mt-2 text-sm leading-relaxed'>
          One command writes the config below and, if you picked a kit, its components. Filters
          themselves you declare per screen, in code.
        </p>
      </div>

      <dl className='divide-y rounded-lg border'>
        {steps.map((step, index) => (
          <div key={step.id} className='flex items-center gap-3 px-3 py-2 text-sm'>
            <dt className='text-muted-foreground w-24 shrink-0'>{step.title}</dt>
            <dd className='min-w-0 flex-1 truncate'>{step.summary(config)}</dd>
            <Button size='sm' variant='ghost' onClick={() => onEdit(index)}>
              Change
            </Button>
          </div>
        ))}
      </dl>

      <div className='overflow-hidden rounded-lg border'>
        <div className='flex items-center gap-1 border-b px-2 py-1.5'>
          {PACKAGE_MANAGERS.map((entry) => (
            <button
              key={entry.label}
              className={cn(
                'rounded-md px-2 py-1 font-mono text-xs transition-colors',
                manager === entry.label
                  ? 'bg-muted text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              )}
              type='button'
              onClick={() => setManager(entry.label)}
            >
              {entry.label}
            </button>
          ))}
          <Button
            aria-label='Copy command'
            className='ml-auto'
            size='icon-sm'
            variant='ghost'
            onClick={copy}
          >
            {copied ? (
              <Check className='size-3.5 text-emerald-500' />
            ) : (
              <Copy className='size-3.5' />
            )}
          </Button>
        </div>
        <code className='block overflow-x-auto p-3 font-mono text-xs break-all whitespace-pre-wrap'>
          {command}
        </code>
      </div>

      <Button className='w-full' onClick={copy}>
        {copied ? <Check className='size-4' /> : <Copy className='size-4' />}
        {copied ? 'Copied' : 'Copy command'}
      </Button>

      <div className='flex flex-col gap-2'>
        <p className='text-muted-foreground text-sm'>
          It writes {files.map((file) => file.target).join(' and ')}
          {kit ? `, plus the ${kit.title} components.` : '.'}
        </p>
        {files.map((file) => (
          <div key={file.target} className='overflow-hidden rounded-lg border'>
            <div className='text-muted-foreground border-b px-3 py-1.5 font-mono text-[11px]'>
              {file.target}
            </div>
            <CodePreview code={file.content} lang={file.name.endsWith('.tsx') ? 'tsx' : 'ts'} />
          </div>
        ))}
      </div>

      <div className='flex items-center justify-between'>
        <Button size='sm' variant='ghost' onClick={onBack}>
          <ArrowLeft className='size-3.5' /> Back
        </Button>
        <Button size='sm' variant='ghost' onClick={onReset}>
          <RotateCcw className='size-3.5' /> Start over
        </Button>
      </div>
    </div>
  );
};
