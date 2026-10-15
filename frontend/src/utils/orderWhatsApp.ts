import type { Product } from '../components/products/ProductCard';
import { formatRwf } from './format';
import {
  buildCartWhatsAppMessage,
  buildProductWhatsAppMessage,
  openWhatsApp,
} from './whatsapp';

type AuthGate = {
  isAuthenticated: boolean;
  openAuthModal: (mode?: 'login' | 'register') => void;
  user?: { fullName?: string; email?: string } | null;
};

/** Require login, then open WhatsApp with full product link + details. */
export function orderProductOnWhatsApp(product: Product, auth: AuthGate, quantity = 1) {
  if (!auth.isAuthenticated) {
    auth.openAuthModal('login');
    return false;
  }
  if (typeof product.stock === 'number' && product.stock <= 0) {
    alert('This product is sold out.');
    return false;
  }

  const message = buildProductWhatsAppMessage({
    name: product.name,
    priceLabel: formatRwf(product.price),
    category: product.category,
    subcategory: product.subcategory,
    size: (product as { size?: string }).size,
    stock: product.stock,
    description: product.description,
    productId: product.id,
    imageUrl: product.imageUrl || product.imageUrls?.[0] || '',
    quantity,
    customerName: auth.user?.fullName,
    customerEmail: auth.user?.email,
  });

  return openWhatsApp(message);
}

export function orderCartOnWhatsApp(
  items: { product: Product; quantity: number }[],
  auth: AuthGate,
) {
  if (!auth.isAuthenticated) {
    auth.openAuthModal('login');
    return false;
  }
  if (!items.length) return false;

  const total = items.reduce((s, i) => s + i.product.price * i.quantity, 0);
  const message = buildCartWhatsAppMessage(
    items.map((i) => ({
      name: i.product.name,
      quantity: i.quantity,
      priceLabel: formatRwf(i.product.price),
      lineTotalLabel: formatRwf(i.product.price * i.quantity),
      productId: i.product.id,
    })),
    formatRwf(total),
    { name: auth.user?.fullName, email: auth.user?.email },
  );

  return openWhatsApp(message);
}
