import Fastify from 'fastify';
import { env } from './config/env.js';
import { supabaseAdmin } from './config/supabase.js';
import { registerCors } from './plugins/cors.js';
import { registerSwagger } from './plugins/swagger.js';
import { registerMultipart } from './plugins/multipart.js';
import { registerSecurityHeaders } from './plugins/securityHeaders.js';
import { registerRoutes } from './routes/index.js';

export async function buildApp(options = {}) {
  const fastify = Fastify({
    logger: true,
    bodyLimit: 1024 * 1024, // 1 MB JSON body limit (uploads use multipart)
    trustProxy: true,
    ...options
  });

  await registerSecurityHeaders(fastify);

  fastify.get('/health', async () => {
    let database = 'not_configured';
    let hint = null;
    let reviews = 'not_checked';
    if (supabaseAdmin) {
      try {
        const { error } = await supabaseAdmin.from('categories').select('id').limit(1);
        if (error) {
          database = `error: ${error.message}`;
          hint = 'Run: cd backend && npm run check-db';
        } else {
          database = 'connected';
          const [reviewsResult, likesResult] = await Promise.all([
            supabaseAdmin.from('product_reviews').select('id').limit(1),
            supabaseAdmin.from('product_likes').select('id').limit(1)
          ]);
          const schemaMissing = [reviewsResult.error, likesResult.error].some(
            (tableError) =>
              tableError?.code === '42P01' ||
              tableError?.code === 'PGRST205' ||
              /could not find the table .*schema cache/i.test(tableError?.message || '')
          );
          reviews = schemaMissing
            ? 'needs_migration'
            : reviewsResult.error || likesResult.error
              ? 'error'
              : 'connected';
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
      features: { reviews },
      ...(reviews === 'needs_migration'
        ? { reviewsHint: 'Run supabase-migrate-reviews-likes.sql in the Supabase SQL Editor for this project.' }
        : {}),
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
