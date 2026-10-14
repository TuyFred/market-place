import { supabaseAdmin } from '../config/supabase.js';
import { ALL_ROLES, getUserRole } from '../utils/roles.js';
import { writeAuditLog } from '../utils/audit.js';

const notConfiguredError = new Error('Supabase is not configured');

function requireSupabase() {
  if (!supabaseAdmin) throw notConfiguredError;
}

function mapPublicUser(user) {
  return {
    id: user.id,
    email: user.email,
    role: getUserRole(user),
    fullName: user.user_metadata?.full_name || ''
  };
}

/**
 * Public signup — ALWAYS creates a customer.
 * Client-supplied role / isAdmin / privileges are ignored.
 */
export async function registerCustomer(payload, request) {
  requireSupabase();

  const {
    fullName,
    email,
    password,
    confirmPassword,
    contactNumber,
    address
  } = payload;

  // Explicitly discard any privilege escalation fields from the client body
  if (payload.role || payload.isAdmin || payload.app_metadata || payload.user_metadata) {
    // Do not honor — continue with customer only
  }

  if (password !== confirmPassword) {
    const err = new Error('Passwords do not match');
    err.statusCode = 400;
    throw err;
  }

  if (typeof password !== 'string' || password.length < 8) {
    const err = new Error('Password must be at least 8 characters');
    err.statusCode = 400;
    throw err;
  }

  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email: String(email).trim().toLowerCase(),
    password,
    email_confirm: true,
    app_metadata: {
      role: 'customer'
    },
    user_metadata: {
      full_name: fullName,
      contact_number: contactNumber,
      address,
      // Keep role out of user_metadata for new accounts; app_metadata is authoritative
    }
  });

  if (error) {
    const err = new Error(error.message);
    err.statusCode = 400;
    throw err;
  }

  await writeAuditLog({
    actorId: data.user.id,
    actorEmail: data.user.email,
    action: 'auth.register_customer',
    targetType: 'user',
    targetId: data.user.id,
    meta: { role: 'customer' },
    request
  });

  return {
    id: data.user.id,
    email: data.user.email,
    role: 'customer'
  };
}

export async function loginUser({ email, password }, request) {
  requireSupabase();

  const { data, error } = await supabaseAdmin.auth.signInWithPassword({
    email: String(email).trim().toLowerCase(),
    password
  });

  if (error || !data.session || !data.user) {
    await writeAuditLog({
      actorEmail: email,
      action: 'auth.login_failed',
      targetType: 'user',
      meta: { reason: error?.message || 'invalid' },
      request
    });
    const err = new Error('Invalid email or password');
    err.statusCode = 401;
    throw err;
  }

  await writeAuditLog({
    actorId: data.user.id,
    actorEmail: data.user.email,
    action: 'auth.login_success',
    targetType: 'user',
    targetId: data.user.id,
    meta: { role: getUserRole(data.user) },
    request
  });

  return {
    accessToken: data.session.access_token,
    user: mapPublicUser(data.user)
  };
}

export async function getUserFromToken(accessToken) {
  requireSupabase();

  const { data, error } = await supabaseAdmin.auth.getUser(accessToken);

  if (error || !data.user) {
    const err = new Error('Invalid or expired token');
    err.statusCode = 401;
    throw err;
  }

  return data.user;
}

/** Verify an admin's password before privileged actions (role change / create admin). */
async function verifyActorPassword(actorEmail, password) {
  if (!password || typeof password !== 'string') {
    const err = new Error('Current admin password is required for this action');
    err.statusCode = 400;
    throw err;
  }
  const { data, error } = await supabaseAdmin.auth.signInWithPassword({
    email: actorEmail,
    password
  });
  if (error || !data.user) {
    const err = new Error('Admin password confirmation failed');
    err.statusCode = 401;
    throw err;
  }
  return data.user;
}

export async function listUsers() {
  requireSupabase();

  const { data, error } = await supabaseAdmin.auth.admin.listUsers();

  if (error) {
    const err = new Error(error.message);
    err.statusCode = 500;
    throw err;
  }

  return (data.users || []).map((u) => ({
    id: u.id,
    email: u.email,
    role: getUserRole(u),
    fullName: u.user_metadata?.full_name || '',
    createdAt: u.created_at
  }));
}

/**
 * Change a user's role. Caller must be a full admin (enforced by route).
 * Promoting to admin requires password re-entry (currentAdminPassword).
 */
export async function updateUserRole(userId, role, actor, currentAdminPassword, request) {
  requireSupabase();

  if (!ALL_ROLES.includes(role)) {
    const err = new Error(`Invalid role. Must be one of: ${ALL_ROLES.join(', ')}`);
    err.statusCode = 400;
    throw err;
  }

  if (getUserRole(actor) !== 'admin') {
    const err = new Error('Only administrators can change roles');
    err.statusCode = 403;
    throw err;
  }

  if (role === 'admin') {
    await verifyActorPassword(actor.email, currentAdminPassword);
  }

  // Fetch existing so we merge metadata instead of wiping it
  const { data: existing, error: getErr } = await supabaseAdmin.auth.admin.getUserById(userId);
  if (getErr || !existing?.user) {
    const err = new Error(getErr?.message || 'User not found');
    err.statusCode = 404;
    throw err;
  }

  const prevRole = getUserRole(existing.user);

  const nextUserMeta = { ...(existing.user.user_metadata || {}) };
  delete nextUserMeta.role; // app_metadata is the source of truth

  const { data, error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
    app_metadata: {
      ...(existing.user.app_metadata || {}),
      role
    },
    user_metadata: nextUserMeta
  });

  if (error) {
    const err = new Error(error.message);
    err.statusCode = 400;
    throw err;
  }

  await writeAuditLog({
    actorId: actor.id,
    actorEmail: actor.email,
    action: 'auth.update_role',
    targetType: 'user',
    targetId: userId,
    meta: { from: prevRole, to: role },
    request
  });

  return mapPublicUser(data.user);
}

/**
 * Create a staff/admin account. Admin-only route + password re-entry required.
 */
export async function createStaffUser(payload, actor, request) {
  requireSupabase();

  const { email, password, fullName, role, currentAdminPassword } = payload;

  if (getUserRole(actor) !== 'admin') {
    const err = new Error('Only administrators can create staff accounts');
    err.statusCode = 403;
    throw err;
  }

  if (!['admin', 'manager'].includes(role)) {
    const err = new Error('Staff role must be admin or manager');
    err.statusCode = 400;
    throw err;
  }

  await verifyActorPassword(actor.email, currentAdminPassword);

  if (typeof password !== 'string' || password.length < 8) {
    const err = new Error('Password must be at least 8 characters');
    err.statusCode = 400;
    throw err;
  }

  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email: String(email).trim().toLowerCase(),
    password,
    email_confirm: true,
    app_metadata: { role },
    user_metadata: {
      full_name: fullName || '',
      created_by: actor.id
    }
  });

  if (error) {
    const err = new Error(error.message);
    err.statusCode = 400;
    throw err;
  }

  await writeAuditLog({
    actorId: actor.id,
    actorEmail: actor.email,
    action: 'auth.create_staff',
    targetType: 'user',
    targetId: data.user.id,
    meta: { role, email: data.user.email },
    request
  });

  return mapPublicUser(data.user);
}

export async function resetUserPassword(userId, newPassword, actor, request) {
  requireSupabase();

  if (getUserRole(actor) !== 'admin') {
    const err = new Error('Only administrators can reset passwords');
    err.statusCode = 403;
    throw err;
  }

  if (!newPassword || typeof newPassword !== 'string' || newPassword.length < 8) {
    const err = new Error('Password must be at least 8 characters');
    err.statusCode = 400;
    throw err;
  }

  const { data, error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
    password: newPassword
  });

  if (error) {
    const err = new Error(error.message);
    err.statusCode = 400;
    throw err;
  }

  await writeAuditLog({
    actorId: actor.id,
    actorEmail: actor.email,
    action: 'auth.reset_password',
    targetType: 'user',
    targetId: userId,
    meta: { result: 'ok' },
    request
  });

  return mapPublicUser(data.user);
}
