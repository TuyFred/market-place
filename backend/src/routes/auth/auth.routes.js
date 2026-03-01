import {
  registerHandler,
  loginHandler,
  listUsersHandler,
  updateUserRoleHandler
} from '../../controllers/auth.controller.js';
import { authGuard } from '../../middlewares/auth.guard.js';
import { adminGuard } from '../../middlewares/admin.guard.js';
import { errorResponseSchema } from '../../schemas/error.schema.js';

const registerBodySchema = {
  type: 'object',
  required: ['fullName', 'email', 'password', 'confirmPassword', 'contactNumber', 'address'],
  properties: {
    fullName: { type: 'string' },
    email: { type: 'string', format: 'email' },
    password: { type: 'string', minLength: 6 },
    confirmPassword: { type: 'string', minLength: 6 },
    contactNumber: { type: 'string' },
    address: { type: 'string' }
  }
};

const loginBodySchema = {
  type: 'object',
  required: ['email', 'password'],
  properties: {
    email: { type: 'string', format: 'email' },
    password: { type: 'string', minLength: 6 }
  }
};

export async function authRoutes(fastify) {
  fastify.post(
    '/register',
    {
      schema: {
        tags: ['Auth'],
        body: registerBodySchema,
        response: {
          201: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              email: { type: 'string' },
              role: { type: 'string' }
            }
          },
          400: errorResponseSchema
        }
      }
    },
    registerHandler
  );

  fastify.post(
    '/login',
    {
      schema: {
        tags: ['Auth'],
        body: loginBodySchema,
        response: {
          200: {
            type: 'object',
            properties: {
              accessToken: { type: 'string' },
              user: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  email: { type: 'string' },
                  role: { type: 'string' },
                  fullName: { type: 'string' }
                }
              }
            }
          },
          401: errorResponseSchema
        }
      }
    },
    loginHandler
  );

  /* ── Admin‑only: user management ── */

  fastify.get(
    '/users',
    {
      preHandler: [authGuard, adminGuard],
      schema: {
        tags: ['Users'],
        response: {
          200: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                email: { type: 'string' },
                role: { type: 'string' },
                fullName: { type: 'string' },
                createdAt: { type: 'string' }
              }
            }
          }
        }
      }
    },
    listUsersHandler
  );

  fastify.put(
    '/users/:id/role',
    {
      preHandler: [authGuard, adminGuard],
      schema: {
        tags: ['Users'],
        body: {
          type: 'object',
          required: ['role'],
          properties: {
            role: { type: 'string', enum: ['admin', 'manager', 'customer'] }
          }
        },
        response: {
          200: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              email: { type: 'string' },
              role: { type: 'string' },
              fullName: { type: 'string' }
            }
          },
          400: errorResponseSchema
        }
      }
    },
    updateUserRoleHandler
  );
}
