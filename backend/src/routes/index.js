import { authRoutes } from './auth/auth.routes.js';
import { productsRoutes } from './products/products.routes.js';
import { categoriesRoutes } from './categories/categories.routes.js';
import { ordersRoutes } from './orders/orders.routes.js';
import { settingsRoutes } from './settings/settings.routes.js';

export async function registerRoutes(fastify) {
  await fastify.register(authRoutes, { prefix: '/auth' });
  await fastify.register(productsRoutes, { prefix: '/products' });
  await fastify.register(categoriesRoutes, { prefix: '/categories' });
  await fastify.register(ordersRoutes, { prefix: '/orders' });
  await fastify.register(settingsRoutes, { prefix: '/settings' });
}

