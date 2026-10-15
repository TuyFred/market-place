import { getStatsHandler } from '../../controllers/stats.controller.js';
import { authGuard } from '../../middlewares/auth.guard.js';
import { adminGuard } from '../../middlewares/admin.guard.js';

export async function statsRoutes(fastify) {
  fastify.get('/', { preHandler: [authGuard, adminGuard] }, getStatsHandler);
}
