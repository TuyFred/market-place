import {
  listProductReviewsHandler,
  createReviewHandler,
  listAllReviewsHandler,
  setReviewVisibilityHandler,
  deleteReviewHandler,
  toggleLikeHandler,
  getLikesHandler
} from '../../controllers/reviews.controller.js';
import { authGuard } from '../../middlewares/auth.guard.js';
import { adminGuard } from '../../middlewares/admin.guard.js';

export async function reviewsRoutes(fastify) {
  fastify.get('/product/:productId', {}, listProductReviewsHandler);
  fastify.get('/product/:productId/likes', {}, getLikesHandler);
  fastify.post('/product/:productId', { preHandler: [authGuard] }, createReviewHandler);
  fastify.post('/product/:productId/like', { preHandler: [authGuard] }, toggleLikeHandler);

  fastify.get('/', { preHandler: [authGuard, adminGuard] }, listAllReviewsHandler);
  fastify.put('/:id/visibility', { preHandler: [authGuard, adminGuard] }, setReviewVisibilityHandler);
  fastify.delete('/:id', { preHandler: [authGuard, adminGuard] }, deleteReviewHandler);
}
