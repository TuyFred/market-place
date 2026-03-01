import {
  createOrderHandler,
  getOrdersHandler,
  getMyOrdersHandler,
  updateOrderStatusHandler,
  uploadProofHandler
} from '../../controllers/orders.controller.js';
import {
  createOrderSchema,
  listOrdersSchema
} from './orders.schema.js';
import { authGuard } from '../../middlewares/auth.guard.js';
import { adminGuard } from '../../middlewares/admin.guard.js';

export async function ordersRoutes(fastify) {
  fastify.post('/', { preHandler: [authGuard], schema: createOrderSchema }, createOrderHandler);

  fastify.post('/:id/proof', { preHandler: [authGuard] }, uploadProofHandler);

  fastify.get(
    '/',
    {
      preHandler: [authGuard, adminGuard],
      schema: listOrdersSchema
    },
    getOrdersHandler
  );

  fastify.get(
    '/my',
    {
      preHandler: [authGuard],
      schema: listOrdersSchema
    },
    getMyOrdersHandler
  );

  fastify.put(
    '/:id/status',
    {
      preHandler: [authGuard, adminGuard],
      schema: {
        tags: ['Orders'],
        params: {
          type: 'object',
          properties: { id: { type: 'string' } }
        },
        body: {
          type: 'object',
          required: ['status'],
          properties: {
            status: {
              type: 'string',
              enum: ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled']
            }
          }
        }
      }
    },
    updateOrderStatusHandler
  );
}
