import fs from 'node:fs/promises';
import path from 'node:path';

import type { RegistryKit } from '@/lib/registry';

/**
 * Reads a kit's source files off disk into shadcn registry file entries.
 *
 * Server-only, and deliberately separate from `lib/registry.ts` so the kit
 * metadata stays importable from client components. Both the static per-kit
 * endpoints and the builder's generated item go through here, so an install
 * always carries exactly the files the site itself renders.
 */
export const readKitFiles = async (kit: RegistryKit) =>
  Promise.all(
    kit.files.map(async (file) => ({
      content: await fs.readFile(path.join(process.cwd(), kit.dir, file), 'utf8'),
      path: `registry/${kit.name}/${file}`,
      target: `${kit.dir}/${file}`,
      type: 'registry:component' as const
    }))
  );
