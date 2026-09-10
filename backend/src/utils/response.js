export function sendSuccess(reply, statusCode, data) {
  return reply.code(statusCode).send(data);
}

export function sendError(reply, statusCode, message) {
  return reply.code(statusCode).send({ message });
}

