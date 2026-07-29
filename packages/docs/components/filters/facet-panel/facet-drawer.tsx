'use client';

import type { ResolvedFilter } from '@mbsatimov/use-filters';
import type { ReactNode } from 'react';

import { Button } from '@/components/ui/button';
import {
  Drawer,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle
} from '@/components/ui/drawer';

import { FacetEditor } from './facet-editors';

/**
 * A bottom drawer editing one facet, opened by `FacetChipRow`.
 *
 * Configure the facets with `commit: 'manual'` and edits stage while the
 * drawer is open: the apply button commits them (`useFilters`' `apply`) and
 * dismissing discards them (`cancel`). With instant filters both are no-ops
 * and every change applies as it happens.
 */
export function FacetDrawer({
  applyLabel = 'Show results',
  filter,
  onApply,
  onCancel,
  onClose,
  renderEditor
}: {
  /** Footer button label — pass a live count, e.g. `Show 12 results`. */
  applyLabel?: ReactNode;
  /** The facet being edited, or `null` while closed. */
  filter: ResolvedFilter | null;
  onApply?: () => void;
  onCancel?: () => void;
  onClose: () => void;
  renderEditor?: (filter: ResolvedFilter) => ReactNode | undefined;
}) {
  const close = (didApply: boolean) => {
    if (didApply) onApply?.();
    else onCancel?.();
    onClose();
  };

  return (
    <Drawer open={filter !== null} onOpenChange={(open) => !open && close(false)}>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>{filter?.label}</DrawerTitle>
        </DrawerHeader>
        <div className='overflow-y-auto px-4 pb-2'>
          {filter && <FacetEditor filter={filter} renderEditor={renderEditor} />}
        </div>
        <DrawerFooter>
          <Button onClick={() => close(true)}>{applyLabel}</Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
