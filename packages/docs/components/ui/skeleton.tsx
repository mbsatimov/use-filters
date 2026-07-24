import { cn } from '@/lib/utils';

const Skeleton = ({ className, ...props }: React.ComponentProps<'div'>) => (
  <div
    className={cn('animate-pulse rounded-md bg-muted', className)}
    data-slot='skeleton'
    {...props}
  />
);

export { Skeleton };
