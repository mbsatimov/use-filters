import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';

/**
 * The "what this actually changes" panel under each step.
 *
 * Every step shows the same two things where they apply — the URL a filtered
 * screen would carry, and the `params` object your fetch receives — because
 * those are the only two surfaces these settings affect. Watching them change
 * as you pick an option is more convincing than a sentence describing it.
 */
export const ExampleBox = ({ children }: { children: ReactNode }) => (
  <div className='bg-muted/40 flex flex-col gap-2 rounded-lg border p-3'>{children}</div>
);

export const ExampleRow = ({
  code,
  label,
  muted
}: {
  code: ReactNode;
  label: string;
  muted?: boolean;
}) => (
  <div className='flex items-baseline gap-3'>
    <span className='text-muted-foreground w-14 shrink-0 text-xs'>{label}</span>
    <code
      className={cn(
        'min-w-0 flex-1 overflow-x-auto font-mono text-xs whitespace-pre',
        muted ? 'text-muted-foreground' : 'text-foreground'
      )}
    >
      {code}
    </code>
  </div>
);

/** Renders `?a=1&b=2` with keys and values distinguished, like the demo window. */
export const QueryLine = ({ path = '/orders', query }: { path?: string; query: string }) => (
  <>
    <span className='text-muted-foreground'>{path}</span>
    <span className='text-muted-foreground/60'>?</span>
    {query
      .split('&')
      .filter(Boolean)
      .map((pair, index) => {
        const [key, ...rest] = pair.split('=');
        return (
          <span key={`${key}-${index}`}>
            {index > 0 && <span className='text-muted-foreground/60'>&</span>}
            <span className='text-foreground/70'>{key}</span>
            <span className='text-muted-foreground/60'>=</span>
            <span className='text-foreground font-medium'>{rest.join('=')}</span>
          </span>
        );
      })}
  </>
);
