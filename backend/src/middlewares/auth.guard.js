import { getUserFromToken } from '../services/auth.service.js';

export async function authGuard(request, reply) {
  const header = request.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return reply.code(401).send({ message: 'Unauthorized' });
  }

  const token = header.split(' ')[1];

  try {
    const user = await getUserFromToken(token);
    request.user = user;
  } catch (err) {
    const statusCode = err.statusCode || 401;
    return reply.code(statusCode).send({ message: err.message });
  }
}

