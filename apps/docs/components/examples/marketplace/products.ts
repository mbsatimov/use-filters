export interface Product {
  id: number;
  name: string;
  brand: string;
  category: string;
  price: number;
  rating: number;
  inStock: boolean;
  emoji: string;
}

export const products: Product[] = [
  {
    id: 1,
    name: 'Aurora Wireless Headphones',
    brand: 'Acme',
    category: 'audio',
    price: 199,
    rating: 4.6,
    inStock: true,
    emoji: '🎧'
  },
  {
    id: 2,
    name: 'Pulse Bluetooth Speaker',
    brand: 'Globex',
    category: 'audio',
    price: 89,
    rating: 4.2,
    inStock: true,
    emoji: '🔊'
  },
  {
    id: 3,
    name: 'Nimbus Mechanical Keyboard',
    brand: 'Initech',
    category: 'computing',
    price: 149,
    rating: 4.8,
    inStock: false,
    emoji: '⌨️'
  },
  {
    id: 4,
    name: 'Vertex Gaming Mouse',
    brand: 'Initech',
    category: 'computing',
    price: 59,
    rating: 4.4,
    inStock: true,
    emoji: '🖱️'
  },
  {
    id: 5,
    name: 'Lumen 4K Monitor',
    brand: 'Umbra',
    category: 'computing',
    price: 429,
    rating: 4.7,
    inStock: true,
    emoji: '🖥️'
  },
  {
    id: 6,
    name: 'Terra Smartwatch',
    brand: 'Acme',
    category: 'wearables',
    price: 249,
    rating: 4.1,
    inStock: true,
    emoji: '⌚'
  },
  {
    id: 7,
    name: 'Halo Fitness Band',
    brand: 'Soylent',
    category: 'wearables',
    price: 79,
    rating: 3.9,
    inStock: false,
    emoji: '📿'
  },
  {
    id: 8,
    name: 'Orbit Drone Mini',
    brand: 'Hooli',
    category: 'photo',
    price: 349,
    rating: 4.3,
    inStock: true,
    emoji: '🚁'
  },
  {
    id: 9,
    name: 'Prism Action Camera',
    brand: 'Hooli',
    category: 'photo',
    price: 279,
    rating: 4.5,
    inStock: true,
    emoji: '📷'
  },
  {
    id: 10,
    name: 'Solace Noise-Cancel Buds',
    brand: 'Acme',
    category: 'audio',
    price: 129,
    rating: 4.0,
    inStock: true,
    emoji: '🎵'
  },
  {
    id: 11,
    name: 'Cobalt USB-C Hub',
    brand: 'Globex',
    category: 'computing',
    price: 45,
    rating: 4.2,
    inStock: true,
    emoji: '🔌'
  },
  {
    id: 12,
    name: 'Ember Portable Charger',
    brand: 'Soylent',
    category: 'accessories',
    price: 39,
    rating: 4.6,
    inStock: true,
    emoji: '🔋'
  },
  {
    id: 13,
    name: 'Quartz Desk Lamp',
    brand: 'Umbra',
    category: 'accessories',
    price: 65,
    rating: 4.4,
    inStock: false,
    emoji: '💡'
  },
  {
    id: 14,
    name: 'Meridian E-Reader',
    brand: 'Globex',
    category: 'wearables',
    price: 159,
    rating: 4.3,
    inStock: true,
    emoji: '📖'
  },
  {
    id: 15,
    name: 'Falcon Webcam Pro',
    brand: 'Hooli',
    category: 'photo',
    price: 99,
    rating: 3.8,
    inStock: true,
    emoji: '🎥'
  },
  {
    id: 16,
    name: 'Zephyr Standing Fan',
    brand: 'Umbra',
    category: 'accessories',
    price: 119,
    rating: 4.1,
    inStock: true,
    emoji: '🌀'
  }
];

export const categoryOptions = [
  { label: 'Audio', value: 'audio' },
  { label: 'Computing', value: 'computing' },
  { label: 'Wearables', value: 'wearables' },
  { label: 'Photo & video', value: 'photo' },
  { label: 'Accessories', value: 'accessories' }
];

export const brandOptions = [
  { label: 'Acme', value: 'Acme' },
  { label: 'Globex', value: 'Globex' },
  { label: 'Initech', value: 'Initech' },
  { label: 'Umbra', value: 'Umbra' },
  { label: 'Soylent', value: 'Soylent' },
  { label: 'Hooli', value: 'Hooli' }
];

export const sortOptions = [
  { label: 'Featured', value: 'featured' },
  { label: 'Price: low to high', value: 'price-asc' },
  { label: 'Price: high to low', value: 'price-desc' },
  { label: 'Top rated', value: 'rating' }
];

/** Cheapest and priciest product, for the price slider bounds. */
export const priceBounds: [number, number] = [
  Math.min(...products.map((p) => p.price)),
  Math.max(...products.map((p) => p.price))
];
