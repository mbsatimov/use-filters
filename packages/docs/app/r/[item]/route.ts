import { baseUrl } from '@/lib/metadata';
import { registryKits } from '@/lib/registry';
import { readKitFiles } from '@/lib/registry-files';

/**
 * The shadcn registry endpoints, statically generated at build time:
 *
 * - `/r/registry.json` — the index of every kit.
 * - `/r/<kit>.json`   — one installable item with its file contents inlined,
 *   in the shape `npx shadcn add <url>` consumes.
 *
 * File contents are read from the same folders the examples' Code tabs show,
 * so an install can never drift from what the site displays.
 */

export const dynamic = 'force-static';

export function generateStaticParams() {
  return [{ item: 'registry.json' }, ...registryKits.map((kit) => ({ item: `${kit.name}.json` }))];
}

export async function GET(_request: Request, context: { params: Promise<{ item: string }> }) {
  const { item } = await context.params;

  if (item === 'registry.json') {
    return Response.json({
      $schema: 'https://ui.shadcn.com/schema/registry.json',
      name: 'use-filters',
      homepage: baseUrl.toString(),
      items: registryKits.map((kit) => ({
        name: kit.name,
        type: 'registry:component',
        title: kit.title,
        description: kit.description
      }))
    });
  }

  const kit = registryKits.find((candidate) => `${candidate.name}.json` === item);
  if (!kit) return new Response('Not found', { status: 404 });

  const files = await readKitFiles(kit);

  return Response.json({
    $schema: 'https://ui.shadcn.com/schema/registry-item.json',
    name: kit.name,
    type: 'registry:component',
    title: kit.title,
    description: kit.description,
    dependencies: kit.dependencies,
    registryDependencies: kit.registryDependencies,
    files
  });
}
