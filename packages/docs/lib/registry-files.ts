import fs from 'node:fs/promises';
import path from 'node:path';

import type { RegistryKit } from '@/lib/registry';

/**
 * Reads a kit's source files off disk into shadcn registry file entries.
 *
 * Targets use the `@components/` placeholder, which the CLI resolves against
 * the consumer's own `components.json` — a default project gets
 * `components/filters/<kit>/…`, a project aliased to `@/shared/ui` gets
 * `shared/ui/filters/<kit>/…`. A literal target would ignore the aliases and
 * force our layout onto theirs.
 *
 * Server-only, and separate from `lib/registry.ts` so the kit metadata stays
 * importable from client components. Both registry endpoints go through here,
 * so an install always carries exactly the files the site itself renders.
 */
export const readKitFiles = async (kit: RegistryKit) => {
  const kitDirName = kit.dir.split('/').at(-1) ?? kit.name;
  return Promise.all(
    kit.files.map(async (file) => ({
      content: await fs.readFile(path.join(process.cwd(), kit.dir, file), 'utf8'),
      path: `registry/${kit.name}/${file}`,
      target: `@components/filters/${kitDirName}/${file}`,
      type: 'registry:component' as const
    }))
  );
};
