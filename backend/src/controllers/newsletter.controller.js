import { subscribeNewsletter } from '../services/newsletter.service.js';
import { sendSuccess, sendError } from '../utils/response.js';

export async function subscribeHandler(request, reply) {
  try {
    const result = await subscribeNewsletter(request.body?.email);
    return sendSuccess(reply, 200, result);
  } catch (err) {
    return sendError(reply, err.statusCode || 400, err.message);
  }
}
