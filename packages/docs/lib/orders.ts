export type OrderStatus = 'paid' | 'pending' | 'refunded' | 'failed';
export type PaymentMethod = 'card' | 'paypal' | 'transfer' | 'crypto';
export type Region = 'na' | 'eu' | 'apac' | 'latam';

export interface Order {
  id: string;
  customer: string;
  email: string;
  status: OrderStatus;
  method: PaymentMethod;
  region: Region;
  items: number;
  date: string; // yyyy-MM-dd
  amount: number;
}

export const statusOptions = [
  { label: 'Paid', value: 'paid' },
  { label: 'Pending', value: 'pending' },
  { label: 'Refunded', value: 'refunded' },
  { label: 'Failed', value: 'failed' }
];

export const methodOptions = [
  { label: 'Card', value: 'card' },
  { label: 'PayPal', value: 'paypal' },
  { label: 'Bank transfer', value: 'transfer' },
  { label: 'Crypto', value: 'crypto' }
];

export const regionOptions = [
  { label: 'North America', value: 'na' },
  { label: 'Europe', value: 'eu' },
  { label: 'Asia Pacific', value: 'apac' },
  { label: 'Latin America', value: 'latam' }
];

export const sortOptions = [
  { label: 'Newest first', value: '-date' },
  { label: 'Oldest first', value: 'date' },
  { label: 'Amount, high to low', value: '-amount' },
  { label: 'Amount, low to high', value: 'amount' }
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
const methods: PaymentMethod[] = ['card', 'paypal', 'card', 'transfer', 'crypto', 'card'];
const regions: Region[] = ['na', 'eu', 'apac', 'latam', 'eu', 'na'];

/** Deterministic dataset (no randomness — SSR and client stay identical). */
export const orders: Order[] = Array.from({ length: 60 }, (_, i) => {
  const customer = customers[i % customers.length];
  // Spread the orders across 2026 so every row has a distinct date — an evenly
  // stepped offset from a fixed start, with a small stagger so it isn't uniform.
  const date = new Date(Date.UTC(2026, 0, 6 + i * 5 + (i % 7)));
  return {
    id: `#${3200 + i}`,
    customer,
    email: `${customer.toLowerCase().replace(/[^a-z]+/g, '.')}@example.com`,
    status: statuses[i % statuses.length],
    method: methods[i % methods.length],
    region: regions[i % regions.length],
    items: ((i * 3) % 7) + 1,
    date: date.toISOString().slice(0, 10),
    amount: 40 + ((i * 137) % 4960)
  };
});

/** Initials for the customer avatar, e.g. "Ada Lovelace" → "AL". */
export function initials(name: string) {
  return name
    .split(' ')
    .slice(0, 2)
    .map((part) => part[0])
    .join('');
}
