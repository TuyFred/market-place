import { getSettingsHandler, uploadHeroVideoHandler } from '../../controllers/settings.controller.js';
import { authGuard } from '../../middlewares/auth.guard.js';
import { adminGuard } from '../../middlewares/admin.guard.js';

export async function settingsRoutes(fastify) {
    fastify.get('/', getSettingsHandler);
    fastify.post('/hero-video', { preHandler: [authGuard, adminGuard] }, uploadHeroVideoHandler);
}
