'use client';

import { useEffect, useState } from 'react';

import { cn } from '@/lib/utils';

/**
 * Client-side syntax highlighting for generated code.
 *
 * The examples' `CodeBlock` highlights on the server, which the builder cannot
 * do — its code changes as you type. So the plain text renders immediately and
 * shiki is loaded lazily to replace it, debounced so a burst of keystrokes
 * highlights once. If the import never resolves the plain text simply stays.
 */
export const CodePreview = ({
  className,
  code,
  lang = 'tsx'
}: {
  className?: string;
  code: string;
  lang?: string;
}) => {
  const [html, setHtml] = useState<string>();

  useEffect(() => {
    let cancelled = false;

    const timer = setTimeout(() => {
      void import('shiki')
        .then(({ codeToHtml }) =>
          codeToHtml(code, {
            defaultColor: false,
            lang,
            themes: { dark: 'github-dark', light: 'github-light' }
          })
        )
        .then((result) => {
          if (!cancelled) setHtml(result);
        })
        .catch(() => {
          // Highlighting is decoration; the plain fallback below stays.
        });
    }, 150);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [code, lang]);

  const shared = 'ex-code overflow-x-auto text-[0.8125rem] leading-relaxed';

  if (!html) {
    return (
      <pre className={cn(shared, 'p-4 font-mono', className)}>
        <code>{code}</code>
      </pre>
    );
  }

  return <div className={cn(shared, className)} dangerouslySetInnerHTML={{ __html: html }} />;
};
