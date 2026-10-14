import {
  registerCustomer,
  loginUser,
  listUsers,
  updateUserRole,
  resetUserPassword,
  createStaffUser,
  requestPasswordReset,
  completePasswordReset
} from '../services/auth.service.js';
import { sendSuccess, sendError } from '../utils/response.js';

export async function registerHandler(request, reply) {
  try {
    const result = await registerCustomer(request.body, request);
    return sendSuccess(reply, 201, result);
  } catch (err) {
    const statusCode = err.statusCode || (err.message === 'Supabase is not configured' ? 500 : 400);
    return sendError(reply, statusCode, err.message);
  }
}

export async function loginHandler(request, reply) {
  try {
    const result = await loginUser(request.body, request);
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
    const user = await updateUserRole(
      request.params.id,
      request.body.role,
      request.user,
      request.body.currentAdminPassword,
      request
    );
    return sendSuccess(reply, 200, user);
  } catch (err) {
    const statusCode = err.statusCode || 400;
    return sendError(reply, statusCode, err.message);
  }
}

export async function resetUserPasswordHandler(request, reply) {
  try {
    const user = await resetUserPassword(
      request.params.id,
      request.body.password,
      request.user,
      request
    );
    return sendSuccess(reply, 200, user);
  } catch (err) {
    const statusCode = err.statusCode || 400;
    return sendError(reply, statusCode, err.message);
  }
}

export async function createStaffHandler(request, reply) {
  try {
    const user = await createStaffUser(request.body, request.user, request);
    return sendSuccess(reply, 201, user);
  } catch (err) {
    const statusCode = err.statusCode || 400;
    return sendError(reply, statusCode, err.message);
  }
}

export async function forgotPasswordHandler(request, reply) {
  try {
    const result = await requestPasswordReset(request.body.email, request);
    return sendSuccess(reply, 200, result);
  } catch (err) {
    const statusCode = err.statusCode || 400;
    return sendError(reply, statusCode, err.message);
  }
}

export async function resetPasswordHandler(request, reply) {
  try {
    const result = await completePasswordReset(request.body, request);
    return sendSuccess(reply, 200, result);
  } catch (err) {
    const statusCode = err.statusCode || 400;
    return sendError(reply, statusCode, err.message);
  }
}
