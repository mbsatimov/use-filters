import type { FilterCommitMode, UseFiltersReturn } from '@mbsatimov/use-filters';

import { Filter, Pencil } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { cn } from '@/lib/utils';

const DEFAULT_COMMIT_OPTIONS: { label: string; value: FilterCommitMode }[] = [
  { label: 'instant', value: 'instant' },
  { label: 'debounce', value: { debounce: 500 } },
  { label: 'manual', value: 'manual' }
];

interface StatePanelProps {
  defaultCommit: FilterCommitMode;
  onDefaultCommitChange: (mode: FilterCommitMode) => void;
  filters: UseFiltersReturn;
}

export function StatePanel({ defaultCommit, onDefaultCommitChange, filters }: StatePanelProps) {
  const { params, filterMap, isFiltered, isDirty, apply, cancel, reset } = filters;

  const draftValues = Object.fromEntries(Object.entries(filterMap).map(([k, v]) => [k, v.value]));

  return (
    <div className='sticky top-20 flex flex-col gap-4'>
      <Card className='gap-4 py-4'>
        <CardHeader className='px-4'>
          <div className='flex items-center justify-between'>
            <CardTitle className='text-sm'>Commit &amp; actions</CardTitle>
            <div className='flex items-center gap-1.5'>
              <StatusPill active={isDirty} label='Dirty' icon={Pencil} />
              <StatusPill active={isFiltered} label='Filtered' icon={Filter} />
            </div>
          </div>
        </CardHeader>
        <CardContent className='flex flex-col gap-4 px-4'>
          <div>
            <p className='text-muted-foreground mb-2 text-xs'>
              Default <code className='code'>commit</code> for filters without their own
            </p>
            <ToggleGroup
              type='single'
              variant='outline'
              value={typeof defaultCommit === 'object' ? 'debounce' : defaultCommit}
              onValueChange={(v) => {
                if (!v) return;
                onDefaultCommitChange(
                  v === 'debounce' ? { debounce: 500 } : (v as FilterCommitMode)
                );
              }}
              className='w-full'
            >
              {DEFAULT_COMMIT_OPTIONS.map((o) => (
                <ToggleGroupItem
                  key={o.label}
                  value={typeof o.value === 'object' ? 'debounce' : o.value}
                  className='flex-1 text-xs'
                >
                  {o.label}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </div>

          <div className='flex gap-2'>
            <Button size='sm' className='flex-1' disabled={!isDirty} onClick={apply}>
              Apply
            </Button>
            <Button
              size='sm'
              variant='outline'
              className='flex-1'
              disabled={!isDirty}
              onClick={cancel}
            >
              Cancel
            </Button>
            <Button
              size='sm'
              variant='outline'
              className='flex-1'
              disabled={!isFiltered && !isDirty}
              onClick={reset}
            >
              Reset
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className='gap-3 py-4'>
        <CardHeader className='px-4'>
          <CardTitle className='text-sm'>Inspector</CardTitle>
        </CardHeader>
        <CardContent className='px-4'>
          <Tabs defaultValue='params'>
            <TabsList className='w-full'>
              <TabsTrigger value='params' className='flex-1'>
                params
              </TabsTrigger>
              <TabsTrigger value='draft' className='flex-1'>
                draft
              </TabsTrigger>
            </TabsList>
            <TabsContent value='params'>
              <JsonBlock value={params} />
            </TabsContent>
            <TabsContent value='draft'>
              <JsonBlock value={draftValues} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

function StatusPill({
  active,
  label,
  icon: Icon
}: {
  active: boolean;
  label: string;
  icon: typeof Pencil;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium transition-colors',
        active
          ? 'border-warning/40 bg-warning/15 text-warning'
          : 'border-border text-muted-foreground'
      )}
    >
      <Icon className='size-3' strokeWidth={2.5} />
      {label}
    </span>
  );
}

function JsonBlock({ value }: { value: unknown }) {
  return (
    <ScrollArea className='bg-muted/40 border-border mt-3 h-64 overflow-hidden rounded-md border'>
      <pre className='scrollbar-thin p-3 font-mono text-xs leading-relaxed whitespace-pre-wrap'>
        {JSON.stringify(value, null, 2)}
      </pre>
    </ScrollArea>
  );
}
