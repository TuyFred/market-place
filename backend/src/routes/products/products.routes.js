import {
  getProductsHandler,
  getProductByIdHandler,
  createProductHandler,
  updateProductHandler,
  deleteProductHandler,
  uploadProductImageHandler
  , proxyProductImageHandler
} from '../../controllers/products.controller.js';
import {
  listProductsSchema,
  createProductSchema,
  updateProductSchema,
  deleteProductSchema,
  uploadProductImageSchema
} from './products.schema.js';
import { authGuard } from '../../middlewares/auth.guard.js';
import { adminGuard } from '../../middlewares/admin.guard.js';

export async function productsRoutes(fastify) {
  fastify.get('/', { schema: listProductsSchema }, getProductsHandler);

  fastify.get('/:id', {}, getProductByIdHandler);

  fastify.post(
    '/',
    {
      preHandler: [authGuard, adminGuard],
      schema: createProductSchema
    },
    createProductHandler
  );

  fastify.put(
    '/:id',
    {
      preHandler: [authGuard, adminGuard],
      schema: updateProductSchema
    },
    updateProductHandler
  );

  fastify.delete(
    '/:id',
    {
      preHandler: [authGuard, adminGuard],
      schema: deleteProductSchema
    },
    deleteProductHandler
  );

  fastify.post(
    '/upload-image',
    {
      preHandler: [authGuard, adminGuard],
      schema: uploadProductImageSchema
    },
    uploadProductImageHandler
  );

  // proxy product image to avoid CORS for frontend blob fetching
  fastify.get('/:id/image', {}, proxyProductImageHandler);
}

