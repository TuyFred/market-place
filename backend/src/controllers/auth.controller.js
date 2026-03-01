import { registerCustomer, loginUser, listUsers, updateUserRole } from '../services/auth.service.js';
import { sendSuccess, sendError } from '../utils/response.js';

export async function registerHandler(request, reply) {
  try {
    const result = await registerCustomer(request.body);
    return sendSuccess(reply, 201, result);
  } catch (err) {
    const statusCode = err.statusCode || (err.message === 'Supabase is not configured' ? 500 : 400);
    return sendError(reply, statusCode, err.message);
  }
}

export async function loginHandler(request, reply) {
  try {
    const result = await loginUser(request.body);
    return sendSuccess(reply, 200, result);
  } catch (err) {
    const statusCode = err.statusCode || (err.message === 'Supabase is not configured' ? 500 : 401);
    return sendError(reply, statusCode, err.message);
  }
}

export async function listUsersHandler(request, reply) {
  try {
    const users = await listUsers();
    return sendSuccess(reply, 200, users);
  } catch (err) {
    const statusCode = err.statusCode || 500;
    return sendError(reply, statusCode, err.message);
  }
}

export async function updateUserRoleHandler(request, reply) {
  try {
    const user = await updateUserRole(request.params.id, request.body.role);
    return sendSuccess(reply, 200, user);
  } catch (err) {
    const statusCode = err.statusCode || 400;
    return sendError(reply, statusCode, err.message);
  }
}
