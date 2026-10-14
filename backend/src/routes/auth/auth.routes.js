import {
  registerHandler,
  loginHandler,
  listUsersHandler,
  updateUserRoleHandler,
  resetUserPasswordHandler,
  createStaffHandler
} from '../../controllers/auth.controller.js';
import { authGuard } from '../../middlewares/auth.guard.js';
import { adminGuard, adminOnlyGuard } from '../../middlewares/admin.guard.js';
import {
  loginRateLimitGuard,
  registerRateLimitGuard,
  mutationRateLimitGuard
} from '../../middlewares/rateLimit.guard.js';
import { errorResponseSchema } from '../../schemas/error.schema.js';

const registerBodySchema = {
  type: 'object',
  required: ['fullName', 'email', 'password', 'confirmPassword', 'contactNumber', 'address'],
  additionalProperties: false,
  properties: {
    fullName: { type: 'string', minLength: 1, maxLength: 120 },
    email: { type: 'string', format: 'email' },
    password: { type: 'string', minLength: 8, maxLength: 128 },
    confirmPassword: { type: 'string', minLength: 8, maxLength: 128 },
    contactNumber: { type: 'string', minLength: 5, maxLength: 40 },
    address: { type: 'string', maxLength: 400 }
  }
};

const loginBodySchema = {
  type: 'object',
  required: ['email', 'password'],
  additionalProperties: false,
  properties: {
    email: { type: 'string', format: 'email' },
    password: { type: 'string', minLength: 6, maxLength: 128 }
  }
};

const createStaffBodySchema = {
  type: 'object',
  required: ['email', 'password', 'role', 'currentAdminPassword'],
  additionalProperties: false,
  properties: {
    email: { type: 'string', format: 'email' },
    password: { type: 'string', minLength: 8, maxLength: 128 },
    fullName: { type: 'string', maxLength: 120 },
    role: { type: 'string', enum: ['admin', 'manager'] },
    currentAdminPassword: { type: 'string', minLength: 6, maxLength: 128 }
  }
};

export async function authRoutes(fastify) {
  // Public: always creates customer (role cannot be set by client)
  fastify.post(
    '/register',
    {
      preHandler: [registerRateLimitGuard],
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
          400: errorResponseSchema,
          429: errorResponseSchema
        }
      }
    },
    registerHandler
  );

  fastify.post(
    '/login',
    {
      preHandler: [loginRateLimitGuard],
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
          401: errorResponseSchema,
          429: errorResponseSchema
        }
      }
    },
    loginHandler
  );

  /* ── Staff: list users (admin or manager) ── */
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

  /* ── Admin only: change roles (password required when promoting to admin) ── */
  fastify.put(
    '/users/:id/role',
    {
      preHandler: [mutationRateLimitGuard, authGuard, adminOnlyGuard],
      schema: {
        tags: ['Users'],
        body: {
          type: 'object',
          required: ['role'],
          additionalProperties: false,
          properties: {
            role: { type: 'string', enum: ['admin', 'manager', 'customer'] },
            currentAdminPassword: { type: 'string', minLength: 6, maxLength: 128 }
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
          400: errorResponseSchema,
          401: errorResponseSchema,
          403: errorResponseSchema
        }
      }
    },
    updateUserRoleHandler
  );

  fastify.put(
    '/users/:id/reset-password',
    {
      preHandler: [mutationRateLimitGuard, authGuard, adminOnlyGuard],
      schema: {
        tags: ['Users'],
        body: {
          type: 'object',
          required: ['password'],
          additionalProperties: false,
          properties: {
            password: { type: 'string', minLength: 8, maxLength: 128 }
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
          400: errorResponseSchema,
          403: errorResponseSchema
        }
      }
    },
    resetUserPasswordHandler
  );

  /* ── Admin only: create admin/manager (not public) ── */
  fastify.post(
    '/admins',
    {
      preHandler: [mutationRateLimitGuard, authGuard, adminOnlyGuard],
      schema: {
        tags: ['Users'],
        body: createStaffBodySchema,
        response: {
          201: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              email: { type: 'string' },
              role: { type: 'string' },
              fullName: { type: 'string' }
            }
          },
          400: errorResponseSchema,
          401: errorResponseSchema,
          403: errorResponseSchema
        }
      }
    },
    createStaffHandler
  );
}
