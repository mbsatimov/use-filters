import type { FilterType } from '@mbsatimov/use-filters';
import type { LucideIcon } from 'lucide-react';

import {
  Calendar,
  CalendarRange,
  Clock,
  Hash,
  List,
  ListChecks,
  Search,
  SlidersHorizontal,
  Tags,
  ToggleLeft,
  User,
  Users
} from 'lucide-react';

/** A small icon per filter kind — purely cosmetic, for scanability in a long list. */
export const FILTER_TYPE_ICON: Record<FilterType, LucideIcon> = {
  text: Search,
  number: Hash,
  numberRange: SlidersHorizontal,
  boolean: ToggleLeft,
  date: Calendar,
  dateRange: CalendarRange,
  time: Clock,
  timeRange: Clock,
  select: List,
  multiSelect: ListChecks,
  tags: Tags,
  asyncSelect: User,
  asyncMultiSelect: Users
};
