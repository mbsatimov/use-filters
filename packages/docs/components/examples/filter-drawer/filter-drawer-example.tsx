'use client';

import { f, useFilters } from '@mbsatimov/use-filters';
import { ChevronLeft, ChevronRight, ShieldCheck, SlidersHorizontal } from 'lucide-react';
import { parseAsInteger, useQueryState } from 'nuqs';
import { useState } from 'react';

import type { User, UserRole } from '@/components/examples/data/users';

import { useQuery } from '@/components/examples/data/use-query';
import {
  fetchUsers,
  roleOptions,
  teamOptions,
  userStatusOptions
} from '@/components/examples/data/users';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle
} from '@/components/ui/drawer';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { cn } from '@/lib/utils';

/**
 * The mobile pattern: one Filters button, everything behind it staged.
 *
 * Every filter uses `commit: 'manual'`, so editing inside the sheet touches
 * neither the URL nor the network — the screen refetches once, on Apply.
 * Closing without applying calls `cancel()`, which throws the draft away; the
 * library holds the draft state, so there is no local form state to manage.
 */
export function FilterDrawerExample() {
  const [open, setOpen] = useState(false);

  const { apply, cancel, filters, filterMap, instantReset, isDirty, params, paramsStr } =
    useFilters({
      search: f.text({ label: 'Search', commit: 'manual' }),
      role: f.multiSelect({
        label: 'Role',
        valueType: 'string',
        options: roleOptions,
        commit: 'manual'
      }),
      status: f.select({
        label: 'Status',
        valueType: 'string',
        options: userStatusOptions,
        commit: 'manual'
      }),
      team: f.select({
        label: 'Team',
        valueType: 'string',
        options: teamOptions,
        commit: 'manual'
      }),
      two_factor: f.boolean({ label: 'Two-factor only', commit: 'manual' })
    });

  const [, setPage] = useQueryState('page', parseAsInteger.withDefault(1));
  const { data, isFetching, isLoading } = useQuery(paramsStr, (signal) =>
    fetchUsers(params, { signal })
  );

  const activeCount = filters.filter((filter) => filter.isFiltered).length;
  const count = data?.count ?? 0;
  const pageCount = Math.max(1, Math.ceil(count / params.per_page));

  // Any close that isn't Apply drops the draft, so reopening shows what's live.
  const onOpenChange = (next: boolean) => {
    if (!next) cancel();
    setOpen(next);
  };

  return (
    <div className='mx-auto flex w-full max-w-md flex-col gap-3'>
      {/* Header row: title + the single entry point to every filter. */}
      <div className='flex items-center justify-between'>
        <div>
          <h2 className='text-base font-semibold'>Team</h2>
          <p className='text-muted-foreground text-sm'>
            {count} {count === 1 ? 'member' : 'members'}
          </p>
        </div>
        <Button variant='outline' onClick={() => setOpen(true)}>
          <SlidersHorizontal className='size-4' />
          Filters
          {activeCount > 0 && (
            <Badge className='rounded-sm px-1.5' variant='secondary'>
              {activeCount}
            </Badge>
          )}
        </Button>
      </div>

      {/* Results */}
      <div
        className={cn(
          'flex flex-col divide-y rounded-lg border transition-opacity',
          isFetching && !isLoading && 'opacity-60'
        )}
      >
        {isLoading && (
          <div className='text-muted-foreground py-16 text-center text-sm'>Loading members…</div>
        )}
        {!isLoading && data?.results.length === 0 && (
          <div className='text-muted-foreground flex flex-col items-center gap-2 py-16 text-sm'>
            No members match these filters.
            <Button size='sm' variant='outline' onClick={instantReset}>
              Clear filters
            </Button>
          </div>
        )}
        {data?.results.map((user) => (
          <UserRow key={user.id} user={user} />
        ))}
      </div>

      {/* Pagination */}
      {pageCount > 1 && (
        <div className='text-muted-foreground flex items-center justify-between text-sm'>
          <span className='tabular-nums'>
            Page {params.page} of {pageCount}
          </span>
          <div className='flex gap-1'>
            <Button
              disabled={params.page <= 1}
              size='icon-sm'
              variant='outline'
              onClick={() => void setPage(params.page - 1)}
            >
              <ChevronLeft />
            </Button>
            <Button
              disabled={params.page >= pageCount}
              size='icon-sm'
              variant='outline'
              onClick={() => void setPage(params.page + 1)}
            >
              <ChevronRight />
            </Button>
          </div>
        </div>
      )}

      {/* The drawer. Filter values below are drafts until Apply commits them. */}
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Filters</DrawerTitle>
            <DrawerDescription>Changes apply when you tap Apply.</DrawerDescription>
          </DrawerHeader>

          <div className='flex flex-col gap-5 overflow-y-auto px-4 py-2'>
            <Field label='Search'>
              <Input
                placeholder='Name or email…'
                value={filterMap.search.value ?? ''}
                onChange={(e) => filterMap.search.onChange(e.target.value || null)}
              />
            </Field>

            <Field label='Role'>
              <ToggleGroup
                className='justify-start gap-1'
                type='multiple'
                value={filterMap.role.value ?? []}
                onValueChange={(values) =>
                  filterMap.role.onChange(values.length ? (values as UserRole[]) : null)
                }
              >
                {roleOptions.map((option) => (
                  <ToggleGroupItem
                    key={option.value}
                    className='rounded-md border px-3 text-xs'
                    value={option.value}
                  >
                    {option.label}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
            </Field>

            <Field label='Status'>
              <Select
                value={filterMap.status.value ?? ''}
                onValueChange={(value) =>
                  filterMap.status.onChange(
                    userStatusOptions.find((option) => option.value === value)?.value ?? null
                  )
                }
              >
                <SelectTrigger className='w-full'>
                  <SelectValue placeholder='Any status' />
                </SelectTrigger>
                <SelectContent>
                  {userStatusOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <Field label='Team'>
              <div className='flex flex-col gap-2'>
                {teamOptions.map((option) => (
                  <label key={option.value} className='flex items-center gap-2 text-sm'>
                    <Checkbox
                      checked={filterMap.team.value === option.value}
                      onCheckedChange={(checked) =>
                        filterMap.team.onChange(checked ? option.value : null)
                      }
                    />
                    {option.label}
                  </label>
                ))}
              </div>
            </Field>

            <label className='flex items-center justify-between text-sm font-medium'>
              Two-factor enabled only
              <Switch
                checked={filterMap.two_factor.value === true}
                onCheckedChange={(checked) => filterMap.two_factor.onChange(checked ? true : null)}
              />
            </label>
          </div>

          <DrawerFooter className='flex-row border-t'>
            <Button
              className='flex-1'
              variant='outline'
              onClick={() => {
                instantReset();
                setOpen(false);
              }}
            >
              Reset
            </Button>
            <Button
              className='flex-1'
              disabled={!isDirty}
              onClick={() => {
                apply();
                setOpen(false);
              }}
            >
              Apply
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </div>
  );
}

const Field = ({ children, label }: { children: React.ReactNode; label: string }) => (
  <div className='flex flex-col gap-2'>
    <Label className='text-muted-foreground text-xs tracking-wide uppercase'>{label}</Label>
    {children}
  </div>
);

const roleBadge: Record<UserRole, string> = {
  admin: 'bg-violet-500/10 text-violet-600 dark:text-violet-400',
  member: 'bg-sky-500/10 text-sky-600 dark:text-sky-400',
  viewer: 'bg-slate-500/10 text-slate-600 dark:text-slate-400'
};

const statusDot: Record<User['status'], string> = {
  active: 'bg-emerald-500',
  invited: 'bg-amber-500',
  suspended: 'bg-red-500'
};

function UserRow({ user }: { user: User }) {
  return (
    <div className='flex items-center gap-3 px-3 py-2.5'>
      <span className='bg-muted text-muted-foreground flex size-9 shrink-0 items-center justify-center rounded-full text-xs font-medium'>
        {user.name
          .split(' ')
          .map((part) => part[0])
          .slice(0, 2)
          .join('')}
      </span>
      <div className='min-w-0 flex-1'>
        <div className='flex items-center gap-1.5'>
          <span className='truncate text-sm font-medium'>{user.name}</span>
          <span className={cn('size-1.5 shrink-0 rounded-full', statusDot[user.status])} />
        </div>
        <div className='text-muted-foreground truncate text-xs'>{user.email}</div>
      </div>
      {user.twoFactor && <ShieldCheck className='text-muted-foreground size-4 shrink-0' />}
      <Badge
        className={cn('border-transparent capitalize', roleBadge[user.role])}
        variant='outline'
      >
        {user.role}
      </Badge>
    </div>
  );
}
