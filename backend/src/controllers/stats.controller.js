import { getAdminStats } from '../services/stats.service.js';
import { sendSuccess, sendError } from '../utils/response.js';

export async function getStatsHandler(request, reply) {
  try {
    const stats = await getAdminStats();
    return sendSuccess(reply, 200, stats);
  } catch (err) {
    return sendError(reply, err.statusCode || 500, err.message);
  }
}
