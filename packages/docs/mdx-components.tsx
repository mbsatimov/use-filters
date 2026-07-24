import type { MDXComponents } from 'mdx/types';

import { Tab, Tabs } from 'fumadocs-ui/components/tabs';
import defaultMdxComponents from 'fumadocs-ui/mdx';

/** Merge Fumadocs' default MDX components with our globally-available extras. */
export function getMDXComponents(components?: MDXComponents): MDXComponents {
  return {
    ...defaultMdxComponents,
    Tab,
    Tabs,
    ...components
  };
}
