import type { Paginated } from './api';

import { delay, isUnset, LATENCY_MS, paginate } from './api';

/**
 * The team-members dataset and its fake list endpoint — the kind of directory
 * an admin "People" screen filters. Deterministic, like the other datasets.
 */

export type UserRole = 'admin' | 'member' | 'viewer';
export type UserStatus = 'active' | 'invited' | 'suspended';

export interface User {
  email: string;
  id: number;
  /** yyyy-MM-dd */
  joined: string;
  name: string;
  role: UserRole;
  status: UserStatus;
  team: string;
  twoFactor: boolean;
}

export const roleOptions: { label: string; value: UserRole }[] = [
  { label: 'Admin', value: 'admin' },
  { label: 'Member', value: 'member' },
  { label: 'Viewer', value: 'viewer' }
];

export const userStatusOptions: { label: string; value: UserStatus }[] = [
  { label: 'Active', value: 'active' },
  { label: 'Invited', value: 'invited' },
  { label: 'Suspended', value: 'suspended' }
];

export const teamOptions = [
  { label: 'Engineering', value: 'engineering' },
  { label: 'Design', value: 'design' },
  { label: 'Sales', value: 'sales' },
  { label: 'Support', value: 'support' }
];

const names = [
  'Nia Okafor',
  'Marcus Chen',
  'Lena Fischer',
  'Diego Ramírez',
  'Aisha Khan',
  'Tomás Silva',
  'Yuki Tanaka',
  'Emma Larsen',
  'Omar Haddad',
  'Priya Nair',
  'Jonas Weber',
  'Sofia Rossi',
  'Elias Berg',
  'Mei Lin',
  'Noah Dubois',
  'Zara Ahmed',
  'Ivan Petrov',
  'Clara Moreau',
  'Kofi Mensah',
  'Hana Kim',
  'Lucas Costa',
  'Ingrid Holm',
  'Rafael Ortiz',
  'Amara Diallo'
];

const roles: UserRole[] = ['member', 'member', 'admin', 'viewer', 'member', 'viewer'];
const userStatuses: UserStatus[] = ['active', 'active', 'invited', 'active', 'suspended'];
const teams = ['engineering', 'design', 'sales', 'support'];

/** Deterministic dataset (no randomness — SSR and client stay identical). */
export const users: User[] = names.map((name, i) => {
  const joined = new Date(Date.UTC(2024, i % 12, 3 + ((i * 7) % 24)));
  return {
    id: 1000 + i,
    name,
    email: `${name.toLowerCase().replace(/[^a-z]+/g, '.')}@acme.dev`,
    role: roles[i % roles.length],
    status: userStatuses[i % userStatuses.length],
    team: teams[i % teams.length],
    joined: joined.toISOString().slice(0, 10),
    twoFactor: i % 3 !== 1
  };
});

/** Query parameters the users endpoint accepts. */
export interface UserListParams {
  /** `[from, to]` as `yyyy-MM-dd`; an empty string leaves that end open. */
  joined?: [string, string] | null;
  page: number;
  per_page: number;
  role?: UserRole[] | null;
  search?: string | null;
  status?: UserStatus | null;
  team?: string | null;
  two_factor?: boolean | null;
}

/**
 * The users list endpoint: filter then paginate, exactly as a server would.
 * Pass the `params` object straight from `useFilters`.
 */
export async function fetchUsers(
  params: UserListParams,
  options: { signal?: AbortSignal } = {}
): Promise<Paginated<User>> {
  await delay(LATENCY_MS, options.signal);

  const { search, role, status, team, joined, two_factor } = params;
  const matched = users.filter((user) => {
    if (!isUnset(search)) {
      const needle = search!.trim().toLowerCase();
      if (!`${user.name} ${user.email}`.toLowerCase().includes(needle)) return false;
    }
    if (!isUnset(role) && !role!.includes(user.role)) return false;
    if (!isUnset(status) && user.status !== status) return false;
    if (!isUnset(team) && user.team !== team) return false;
    if (!isUnset(joined)) {
      const [from, to] = joined!;
      if (from && user.joined < from) return false;
      if (to && user.joined > to) return false;
    }
    if (!isUnset(two_factor) && user.twoFactor !== two_factor) return false;
    return true;
  });

  return paginate(matched, params.page, params.per_page);
}
