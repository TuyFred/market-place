import { getUserRole, isAdmin, isStaff } from '../utils/roles.js';

/** Admin or manager (catalog / orders staff). */
export async function adminGuard(request, reply) {
  if (!isStaff(request.user)) {
    return reply.code(403).send({ message: 'Admin or manager access only' });
  }
}

/** Full administrator only (user/role management, create admins). */
export async function adminOnlyGuard(request, reply) {
  if (!isAdmin(request.user)) {
    return reply.code(403).send({
      message: 'Administrator access only. Managers cannot manage roles or create admins.'
    });
  }
}

export { getUserRole };
