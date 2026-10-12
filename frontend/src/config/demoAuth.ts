import { DEMO_PRODUCTS } from './brand';

/** Offline demo admin — no database required */
export const DEMO_ADMIN = {
  email: 'admin@system.com',
  password: 'admin123@',
  token: 'demo-admin-token',
  user: {
    id: 'demo-admin',
    email: 'admin@system.com',
    role: 'admin',
    fullName: 'Demo Admin',
  },
} as const;

export function isDemoAdminToken(token?: string | null) {
  return token === DEMO_ADMIN.token || localStorage.getItem('demo_mode') === '1';
}

export function tryDemoLogin(email: string, password: string) {
  if (
    email.trim().toLowerCase() === DEMO_ADMIN.email &&
    password === DEMO_ADMIN.password
  ) {
    return {
      user: { ...DEMO_ADMIN.user },
      accessToken: DEMO_ADMIN.token,
    };
  }
  return null;
}

export function enterDemoAdminSession() {
  localStorage.setItem('demo_mode', '1');
  localStorage.setItem('customer_token', DEMO_ADMIN.token);
  localStorage.setItem('customer_user', JSON.stringify(DEMO_ADMIN.user));
  localStorage.setItem('admin_token', DEMO_ADMIN.token);
  localStorage.setItem('admin_user', JSON.stringify(DEMO_ADMIN.user));
}

const CAT_KEY = 'demo_categories';
const PROD_KEY = 'demo_products';
const ORDER_KEY = 'demo_orders';
const USER_KEY = 'demo_users';

export type DemoCategory = { id: string; name: string; slug: string };
export type DemoProduct = {
  id: string;
  name: string;
  description?: string;
  price: number;
  category: string;
  size?: string;
  imageUrl?: string;
  imageUrls?: string[];
  stock?: number;
  is_active?: boolean;
};

const DEFAULT_CATEGORIES: DemoCategory[] = [
  { id: 'f1', name: 'African Traditional', slug: 'african-traditional' },
  { id: 'f2', name: 'Ankara & Prints', slug: 'ankara-prints' },
  { id: 'f3', name: 'Modern Casual', slug: 'modern-casual' },
  { id: 'f4', name: 'Women Wear', slug: 'women-wear' },
  { id: 'f5', name: 'Men Wear', slug: 'men-wear' },
  { id: 'f6', name: 'Kids Wear', slug: 'kids-wear' },
  { id: 'f7', name: 'Formal & Occasion', slug: 'formal-occasion' },
  { id: 'f8', name: 'Street Style', slug: 'street-style' },
];

function defaultProducts(): DemoProduct[] {
  return DEMO_PRODUCTS.slice(0, 24).map((p, i) => ({
    id: p.id,
    name: p.name,
    description: p.description,
    price: p.price,
    category: p.categorySlug,
    imageUrl: p.imageUrl,
    imageUrls: [p.imageUrl],
    stock: i % 5 === 3 ? 0 : 8 + (i % 10),
    is_active: true,
    size: ['S', 'M', 'L', 'XL'][i % 4],
  }));
}

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown) {
  localStorage.setItem(key, JSON.stringify(value));
}

export function loadDemoCategories(): DemoCategory[] {
  const list = readJson<DemoCategory[]>(CAT_KEY, []);
  if (list.length) return list;
  writeJson(CAT_KEY, DEFAULT_CATEGORIES);
  return DEFAULT_CATEGORIES;
}

export function saveDemoCategories(categories: DemoCategory[]) {
  writeJson(CAT_KEY, categories);
}

export function loadDemoProducts(): DemoProduct[] {
  const list = readJson<DemoProduct[]>(PROD_KEY, []);
  if (list.length) return list;
  const seeded = defaultProducts();
  writeJson(PROD_KEY, seeded);
  return seeded;
}

export function saveDemoProducts(products: DemoProduct[]) {
  writeJson(PROD_KEY, products);
}

export function loadDemoOrders() {
  return readJson(ORDER_KEY, [
    {
      id: 'demo-order-1',
      customer_name: 'Amina N.',
      customer_phone: '+250 788 000 111',
      customer_address: 'Kigali',
      status: 'pending',
      created_at: new Date().toISOString(),
      products: { name: 'Kente Heritage Robe', price: 19379, category: 'african-traditional' },
    },
    {
      id: 'demo-order-2',
      customer_name: 'Jean P.',
      customer_phone: '+250 788 000 222',
      customer_address: 'Musanze',
      status: 'confirmed',
      created_at: new Date().toISOString(),
      products: { name: 'Ankara Wrap Dress', price: 24500, category: 'ankara-prints' },
    },
  ]);
}

export function saveDemoOrders(orders: unknown[]) {
  writeJson(ORDER_KEY, orders);
}

export function loadDemoUsers() {
  return readJson(USER_KEY, [
    {
      id: 'demo-admin',
      email: DEMO_ADMIN.email,
      role: 'admin',
      fullName: 'Demo Admin',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'demo-customer-1',
      email: 'customer@demo.com',
      role: 'customer',
      fullName: 'Demo Customer',
      createdAt: new Date().toISOString(),
    },
  ]);
}

export function saveDemoUsers(users: unknown[]) {
  writeJson(USER_KEY, users);
}
