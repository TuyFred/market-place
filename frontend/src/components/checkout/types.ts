import type { Product } from '../products/ProductCard';

export type CheckoutLine = {
  product: Product;
  quantity: number;
};