export async function adminGuard(request, reply) {
  const user = request.user;
  const role =
    user?.user_metadata?.role ||
    user?.app_metadata?.role ||
    user?.role ||
    'customer';

  if (role !== 'admin' && role !== 'manager') {
    return reply.code(403).send({ message: 'Admin or manager access only' });
  }
}

