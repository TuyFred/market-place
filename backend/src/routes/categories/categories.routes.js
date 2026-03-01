import {
  getCategoriesHandler,
  createCategoryHandler,
  updateCategoryHandler,
  deleteCategoryHandler
} from '../../controllers/categories.controller.js';
import {
  listCategoriesSchema,
  createCategorySchema,
  updateCategorySchema,
  deleteCategorySchema
} from './categories.schema.js';
import { authGuard } from '../../middlewares/auth.guard.js';
import { adminGuard } from '../../middlewares/admin.guard.js';

export async function categoriesRoutes(fastify) {
  fastify.get('/', { schema: listCategoriesSchema }, getCategoriesHandler);

  fastify.post(
    '/',
    {
      preHandler: [authGuard, adminGuard],
      schema: createCategorySchema
    },
    createCategoryHandler
  );

  fastify.put(
    '/:id',
    {
      preHandler: [authGuard, adminGuard],
      schema: updateCategorySchema
    },
    updateCategoryHandler
  );

  fastify.delete(
    '/:id',
    {
      preHandler: [authGuard, adminGuard],
      schema: deleteCategorySchema
    },
    deleteCategoryHandler
  );
}
