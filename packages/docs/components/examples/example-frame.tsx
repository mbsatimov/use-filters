'use client';

import { Check, Code2, Copy, Eye } from 'lucide-react';
import { type ReactNode, useState } from 'react';

import { cn } from '@/lib/utils';

export interface ExampleFile {
  name: string;
  /** Pre-highlighted code, rendered on the server. */
  code: ReactNode;
  /** Raw source, for the copy button. */
  raw: string;
}

/**
 * The framed viewer around each example: a bordered card with a Preview / Code
 * toggle. The live preview stays mounted across tabs (hidden with CSS) so its
 * URL state survives switching to the code view.
 */
export function ExampleFrame({ preview, files }: { preview: ReactNode; files: ExampleFile[] }) {
  const [tab, setTab] = useState<'preview' | 'code'>('preview');
  const [fileIndex, setFileIndex] = useState(0);
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    await navigator.clipboard.writeText(files[fileIndex].raw);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className='border-border bg-card overflow-hidden rounded-xl border'>
      <div className='border-border flex items-center gap-1 border-b px-2 py-1.5'>
        <TabButton active={tab === 'preview'} onClick={() => setTab('preview')} icon={<Eye />}>
          Preview
        </TabButton>
        <TabButton active={tab === 'code'} onClick={() => setTab('code')} icon={<Code2 />}>
          Code
        </TabButton>
        {tab === 'code' && (
          <>
            <div className='mx-1 flex flex-wrap gap-1'>
              {files.map((f, i) => (
                <button
                  key={f.name}
                  type='button'
                  onClick={() => setFileIndex(i)}
                  className={cn(
                    'rounded-md px-2 py-1 font-mono text-xs transition-colors',
                    i === fileIndex
                      ? 'bg-muted text-foreground'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  {f.name}
                </button>
              ))}
            </div>
            <button
              type='button'
              onClick={copy}
              className='text-muted-foreground hover:text-foreground ml-auto rounded-md p-1.5 transition-colors'
              aria-label='Copy code'
            >
              {copied ? <Check className='size-4' /> : <Copy className='size-4' />}
            </button>
          </>
        )}
      </div>

      {/* Preview stays mounted (URL state persists); toggled with CSS. */}
      <div className={cn('bg-background p-4 sm:p-6', tab === 'preview' ? 'block' : 'hidden')}>
        {preview}
      </div>
      <div className={cn('max-h-[36rem] overflow-auto', tab === 'code' ? 'block' : 'hidden')}>
        {files.map((f, i) => (
          <div key={f.name} className={i === fileIndex ? 'block' : 'hidden'}>
            {f.code}
          </div>
        ))}
      </div>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  icon,
  children
}: {
  active: boolean;
  onClick: () => void;
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <button
      type='button'
      onClick={onClick}
      className={cn(
        'flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm font-medium transition-colors [&_svg]:size-4',
        active ? 'bg-muted text-foreground' : 'text-muted-foreground hover:text-foreground'
      )}
    >
      {icon}
      {children}
    </button>
  );
}
