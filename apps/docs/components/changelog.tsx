import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

import './changelog.css';

/** Read the package's generated CHANGELOG.md (repo root) at build time. */
function readChangelog(): string {
  const raw = readFileSync(join(process.cwd(), '..', '..', 'CHANGELOG.md'), 'utf8');
  // Drop the leading `# Changelog` heading — the docs page renders its own title.
  return raw.replace(/^#\s+Changelog\s*\n/, '');
}

/** Renders the root CHANGELOG.md as markdown, styled by the surrounding docs body. */
export function Changelog() {
  return (
    <div className='changelog-body'>
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{readChangelog()}</ReactMarkdown>
    </div>
  );
}
