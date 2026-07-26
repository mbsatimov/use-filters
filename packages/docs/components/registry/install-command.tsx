'use client';

import { Check, Copy, Terminal } from 'lucide-react';
import { useState } from 'react';

/** A copyable install one-liner, styled like a terminal prompt. */
export function InstallCommand({ command }: { command: string }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    await navigator.clipboard.writeText(command);
    setCopied(true);
    setTimeout(setCopied, 1500, false);
  };

  return (
    <div className='bg-muted/40 flex items-center gap-2 overflow-hidden rounded-lg border px-3 py-2'>
      <Terminal className='text-muted-foreground size-4 shrink-0' />
      <code className='flex-1 overflow-x-auto font-mono text-xs whitespace-nowrap'>{command}</code>
      <button
        aria-label='Copy install command'
        className='text-muted-foreground hover:text-foreground shrink-0 rounded-md p-1 transition-colors'
        type='button'
        onClick={copy}
      >
        {copied ? <Check className='size-3.5' /> : <Copy className='size-3.5' />}
      </button>
    </div>
  );
}
