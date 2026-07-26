'use client';

import type { ReactNode } from 'react';

import {
  Check,
  Copy,
  ExternalLink,
  FileCode2,
  Github,
  Link as LinkIcon,
  Monitor,
  Package,
  RotateCw,
  Smartphone,
  Tablet
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import { QueryString } from '@/components/demo-window';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

export interface BlockFile {
  /** Pre-highlighted code, rendered on the server. */
  code: ReactNode;
  name: string;
  /** Docs-package-relative path, shown in the code header. */
  path: string;
  /** Raw source, for the copy button. */
  raw: string;
}

export type Viewport = '100%' | '400' | '768';

interface BlockViewerProps {
  /** Initial preview width — mobile-first examples open at phone width. */
  defaultViewport?: Viewport;
  files: BlockFile[];
  iframeHeight: number;
  /** Registry kit names this example builds on — rendered as tags linking to /registry. */
  kits?: string[];
  slug: string;
  sourceUrl: string;
  tagline: string;
  title: string;
}

/**
 * The frame around each example on the gallery page: a title row, a
 * Preview/Code toggle, a viewport switcher, and the framed content.
 *
 * The preview is an iframe onto `/examples/preview/[slug]` — each example is a
 * real page with its own URL, so several URL-synced demos can live on one page
 * without fighting over the address bar. The window chrome above the iframe
 * shows that URL live, so you can watch the filters write it.
 */
export function BlockViewer({
  defaultViewport = '100%',
  files,
  iframeHeight,
  kits = [],
  slug,
  sourceUrl,
  tagline,
  title
}: BlockViewerProps) {
  const [tab, setTab] = useState<'code' | 'preview'>('preview');
  const [viewport, setViewport] = useState<Viewport>(defaultViewport);
  const [fileIndex, setFileIndex] = useState(0);
  const [copied, setCopied] = useState(false);

  const previewUrl = `/examples/preview/${slug}`;
  const activeFile = files[fileIndex];

  const copy = async () => {
    await navigator.clipboard.writeText(activeFile.raw);
    setCopied(true);
    setTimeout(setCopied, 1500, false);
  };

  return (
    <section className='scroll-mt-24' id={slug}>
      {/* Title row */}
      <div className='mb-4 flex flex-wrap items-center gap-x-3 gap-y-2'>
        <a
          className='group flex items-center gap-2 text-lg font-semibold tracking-tight'
          href={`#${slug}`}
        >
          {title}
          <LinkIcon className='text-muted-foreground size-3.5 opacity-0 transition-opacity group-hover:opacity-100' />
        </a>
        <span className='text-muted-foreground text-sm'>{tagline}</span>
        {kits.map((kit) => (
          <a
            key={kit}
            className='bg-primary/10 text-primary hover:bg-primary/15 inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 font-mono text-xs transition-colors'
            href={`/registry#${kit}`}
            title={`Built on the ${kit} kit — see the registry`}
          >
            <Package className='size-3' />
            {kit}
          </a>
        ))}

        {/* Toolbar */}
        <div className='ml-auto flex items-center gap-1.5'>
          <Tabs value={tab} onValueChange={(value) => setTab(value as 'code' | 'preview')}>
            <TabsList>
              <TabsTrigger value='preview'>Preview</TabsTrigger>
              <TabsTrigger value='code'>Code</TabsTrigger>
            </TabsList>
          </Tabs>

          <Separator className='hidden h-5 md:block' orientation='vertical' />

          <ToggleGroup
            className='hidden md:flex'
            size='sm'
            type='single'
            value={tab === 'preview' ? viewport : ''}
            onValueChange={(value) => {
              if (!value) return;
              setTab('preview');
              setViewport(value as Viewport);
            }}
          >
            <ToggleGroupItem aria-label='Desktop preview' value='100%'>
              <Monitor className='size-3.5' />
            </ToggleGroupItem>
            <ToggleGroupItem aria-label='Tablet preview' value='768'>
              <Tablet className='size-3.5' />
            </ToggleGroupItem>
            <ToggleGroupItem aria-label='Mobile preview' value='400'>
              <Smartphone className='size-3.5' />
            </ToggleGroupItem>
          </ToggleGroup>

          <Separator className='h-5' orientation='vertical' />

          <IconAction href={previewUrl} label='Open in new tab'>
            <ExternalLink className='size-3.5' />
          </IconAction>
          <IconAction href={sourceUrl} label='View source on GitHub'>
            <Github className='size-3.5' />
          </IconAction>
        </div>
      </div>

      {/* Preview stays mounted while the code tab is open, so its URL state
          survives switching back. */}
      <div className={tab === 'preview' ? 'block' : 'hidden'}>
        <div className='rounded-xl border bg-[radial-gradient(var(--color-border)_1px,transparent_1px)] [background-size:14px_14px] p-3 sm:p-5'>
          <BrowserWindow height={iframeHeight} path={previewUrl} title={title} width={viewport} />
        </div>
      </div>

      {tab === 'code' && (
        <div className='bg-card grid overflow-hidden rounded-xl border md:grid-cols-[14rem_1fr]'>
          {/* File tree */}
          <aside className='bg-muted/40 flex flex-row gap-1 overflow-x-auto border-b p-2 md:flex-col md:border-r md:border-b-0'>
            {files.map((file, index) => (
              <button
                key={file.path}
                className={cn(
                  'flex shrink-0 items-center gap-1.5 rounded-md px-2 py-1.5 text-left font-mono text-xs whitespace-nowrap transition-colors md:min-w-0 md:shrink',
                  index === fileIndex
                    ? 'bg-background text-foreground border shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                )}
                title={file.name}
                type='button'
                onClick={() => setFileIndex(index)}
              >
                <FileCode2 className='size-3.5 shrink-0' />
                <span className='md:truncate'>{file.name}</span>
              </button>
            ))}
          </aside>

          {/* Code pane */}
          <div className='min-w-0'>
            <div className='bg-muted/40 flex items-center justify-between border-b px-3 py-1.5'>
              <span className='text-muted-foreground truncate font-mono text-xs'>
                {activeFile.path}
              </span>
              <IconAction label='Copy file' onClick={copy}>
                {copied ? <Check className='size-3.5' /> : <Copy className='size-3.5' />}
              </IconAction>
            </div>
            <div className='max-h-[37.5rem] overflow-auto'>
              {files.map((file, index) => (
                <div key={file.path} className={index === fileIndex ? 'block' : 'hidden'}>
                  {file.code}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

/**
 * The iframe dressed as a browser window: traffic lights, a reload button, and
 * a URL bar mirroring the iframe's real (same-origin) location — polled, since
 * `replaceState` inside the frame fires no event the parent can hear.
 */
function BrowserWindow({
  height,
  path,
  title,
  width
}: {
  height: number;
  path: string;
  title: string;
  width: Viewport;
}) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [queryString, setQueryString] = useState('');

  // Reload in place (same origin), so the URL — and with it, the filters —
  // survives, exactly like a real browser reload.
  const reload = () => iframeRef.current?.contentWindow?.location.reload();

  useEffect(() => {
    const timer = setInterval(() => {
      try {
        const search = iframeRef.current?.contentWindow?.location.search ?? '';
        setQueryString((current) => (current === search ? current : search));
      } catch {
        // Cross-origin only during error states; leave the bar as-is.
      }
    }, 300);
    return () => clearInterval(timer);
  }, []);

  return (
    <div
      className='bg-card mx-auto w-full overflow-hidden rounded-lg border shadow-sm transition-[max-width] duration-300'
      style={{ maxWidth: width === '100%' ? '100%' : `${width}px` }}
    >
      <div className='bg-muted/40 flex items-center gap-3 border-b px-3 py-2'>
        <div className='flex shrink-0 gap-1.5'>
          <span className='size-2.5 rounded-full bg-red-400/80' />
          <span className='size-2.5 rounded-full bg-amber-400/80' />
          <span className='size-2.5 rounded-full bg-emerald-400/80' />
        </div>
        <button
          aria-label='Reload the example'
          className='text-muted-foreground hover:text-foreground focus-visible:ring-ring shrink-0 rounded-md transition-colors focus-visible:ring-2 focus-visible:outline-none'
          title='Reload — the filters survive, because they live in the URL'
          type='button'
          onClick={reload}
        >
          <RotateCw className='size-3.5' />
        </button>
        <div className='bg-background flex-1 overflow-x-auto rounded-md border px-2.5 py-1 [scrollbar-width:none]'>
          <code className='font-mono text-xs whitespace-nowrap'>
            <span className='text-muted-foreground'>{path}</span>
            <QueryString value={queryString} />
          </code>
        </div>
      </div>
      <iframe
        ref={iframeRef}
        className='bg-background block w-full'
        src={path}
        style={{ height }}
        title={`${title} example preview`}
      />
    </div>
  );
}

/** A small labelled icon button; renders a link when `href` is given. */
function IconAction({
  children,
  href,
  label,
  onClick
}: {
  children: ReactNode;
  href?: string;
  label: string;
  onClick?: () => void;
}) {
  const button = href ? (
    <Button asChild size='icon-sm' variant='ghost'>
      <a
        aria-label={label}
        href={href}
        rel={href.startsWith('http') ? 'noreferrer' : undefined}
        target='_blank'
      >
        {children}
      </a>
    </Button>
  ) : (
    <Button aria-label={label} size='icon-sm' variant='ghost' onClick={onClick}>
      {children}
    </Button>
  );

  return (
    <Tooltip>
      <TooltipTrigger asChild>{button}</TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}
