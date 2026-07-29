import { absoluteUrl } from '@/lib/metadata';

import type { PackageManager, ProjectConfig } from './types';

import { toSearchParams } from './encode';
import { PACKAGE_MANAGERS } from './types';

/** The registry URL the shadcn CLI fetches, carrying the chosen setup. */
export const installUrl = (config: ProjectConfig) =>
  `${absoluteUrl('/r/init.json')}?${toSearchParams(config)}`;

/**
 * The command to run. Quoted because the URL contains `?` and `&`, which every
 * shell would otherwise treat as globbing and job control.
 */
export const installCommand = (config: ProjectConfig, manager: PackageManager) => {
  const runner = PACKAGE_MANAGERS.find((entry) => entry.label === manager)?.runner ?? 'npx';
  return `${runner} shadcn@latest add "${installUrl(config)}"`;
};

/** A link that reopens the flow on this configuration. */
export const shareUrl = (config: ProjectConfig) =>
  `${absoluteUrl('/start')}?${toSearchParams(config)}`;
