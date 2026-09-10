import Fastify from 'fastify';
import { env } from './config/env.js';
import { supabaseAdmin } from './config/supabase.js';
import { registerCors } from './plugins/cors.js';
import { registerSwagger } from './plugins/swagger.js';
import { registerMultipart } from './plugins/multipart.js';
import { registerRoutes } from './routes/index.js';

export async function buildApp(options = {}) {
  const fastify = Fastify({
    logger: true,
    ...options
  });

  fastify.get('/health', async () => {
    let database = 'not_configured';
    let hint = null;
    if (supabaseAdmin) {
      try {
        const { error } = await supabaseAdmin.from('categories').select('id').limit(1);
        if (error) {
          database = `error: ${error.message}`;
          hint = 'Run: cd backend && npm run check-db';
        } else {
          database = 'connected';
        }
      } catch (err) {
        database = `error: ${err.message || 'unreachable'}`;
        hint =
          'Supabase host unreachable. Create a project at supabase.com, update backend/.env, run supabase-schema.sql, then: npm run check-db';
      }
    } else {
      hint = 'Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in backend/.env';
    }
    return {
      status: database === 'connected' ? 'ok' : 'degraded',
      env: env.NODE_ENV,
      database,
      ...(hint ? { hint } : {})
    };
  });

  // Register Swagger at root context so .swagger() is available in server.js
  await registerSwagger(fastify);

  fastify.register(async (instance) => {
    await registerCors(instance);
    await registerMultipart(instance);
    await registerRoutes(instance);
  }, { prefix: '/api' });

  return fastify;
}
