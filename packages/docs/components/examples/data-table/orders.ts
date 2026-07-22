export type OrderStatus = 'paid' | 'pending' | 'refunded' | 'failed';

export interface Order {
  id: string;
  customer: string;
  email: string;
  status: OrderStatus;
  date: string; // yyyy-MM-dd
  amount: number;
}

export const statusOptions = [
  { label: 'Paid', value: 'paid' },
  { label: 'Pending', value: 'pending' },
  { label: 'Refunded', value: 'refunded' },
  { label: 'Failed', value: 'failed' }
];

const customers = [
  'Ada Lovelace',
  'Alan Turing',
  'Grace Hopper',
  'Katherine Johnson',
  'Edsger Dijkstra',
  'Barbara Liskov',
  'Donald Knuth',
  'Margaret Hamilton',
  'Linus Torvalds',
  'Radia Perlman',
  'Tim Berners-Lee',
  'Anita Borg',
  'Ken Thompson',
  'Frances Allen',
  'Dennis Ritchie',
  'Shafi Goldwasser',
  'Guido van Rossum',
  'Karen Spärck Jones',
  'John Carmack',
  'Sophie Wilson',
  'Bjarne Stroustrup',
  'Joan Clarke'
];

const statuses: OrderStatus[] = [
  'paid',
  'paid',
  'pending',
  'refunded',
  'paid',
  'failed',
  'pending'
];

// Deterministic dataset (no randomness — SSR and client stay identical).
export const orders: Order[] = Array.from({ length: 44 }, (_, i) => {
  const customer = customers[i % customers.length];
  const day = ((i * 7) % 28) + 1;
  const month = ((i * 3) % 12) + 1;
  return {
    id: `#${3200 + i}`,
    customer,
    email: `${customer.toLowerCase().replace(/[^a-z]+/g, '.')}@example.com`,
    status: statuses[i % statuses.length],
    date: `2026-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
    amount: 40 + ((i * 137) % 960)
  };
});
