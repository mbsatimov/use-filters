import { codeToHtml } from 'shiki';

/**
 * Server-side syntax highlighting for the examples' "Code" tab. Uses shiki
 * with a dual light/dark theme (CSS-variable output), styled by `.ex-code` in
 * examples.css so it switches with the site theme. Self-contained — the
 * examples route is outside the docs layout, so it doesn't share fumadocs'
 * code styling.
 */
export async function CodeBlock({ code, lang = 'tsx' }: { code: string; lang?: string }) {
  const html = await codeToHtml(code, {
    lang,
    themes: { light: 'github-light-default', dark: 'github-dark-default' },
    defaultColor: false
  });

  return (
    <div
      className='ex-code overflow-x-auto text-[0.8125rem] leading-relaxed'
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
