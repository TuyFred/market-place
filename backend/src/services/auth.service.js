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
    fullName: user.user_metadata?.full_name || '',
    suspended: !!user.app_metadata?.suspended,
    createdAt: user.created_at
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

  if (data.user.app_metadata?.suspended) {
    const err = new Error(
      'Your account has been suspended. Please contact AFROLUXO support for help.'
    );
    err.statusCode = 403;
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

  return (data.users || []).map((u) => mapPublicUser(u));
}

export async function updateUserProfileAdmin(userId, payload, actor, request) {
  requireSupabase();
  if (getUserRole(actor) !== 'admin') {
    const err = new Error('Only administrators can edit users');
    err.statusCode = 403;
    throw err;
  }
  const { data: existing, error: getErr } = await supabaseAdmin.auth.admin.getUserById(userId);
  if (getErr || !existing?.user) {
    const err = new Error(getErr?.message || 'User not found');
    err.statusCode = 404;
    throw err;
  }
  const updates = {
    user_metadata: {
      ...(existing.user.user_metadata || {}),
      full_name: payload.fullName ?? existing.user.user_metadata?.full_name
    }
  };
  if (payload.email && payload.email !== existing.user.email) {
    updates.email = String(payload.email).trim().toLowerCase();
    updates.email_confirm = true;
  }
  const { data, error } = await supabaseAdmin.auth.admin.updateUserById(userId, updates);
  if (error) {
    const err = new Error(error.message);
    err.statusCode = 400;
    throw err;
  }
  await writeAuditLog({
    actorId: actor.id,
    actorEmail: actor.email,
    action: 'auth.update_user',
    targetType: 'user',
    targetId: userId,
    request
  });
  return mapPublicUser(data.user);
}

export async function setUserSuspended(userId, suspended, message, actor, request) {
  requireSupabase();
  if (getUserRole(actor) !== 'admin') {
    const err = new Error('Only administrators can suspend users');
    err.statusCode = 403;
    throw err;
  }
  if (userId === actor.id) {
    const err = new Error('You cannot suspend your own account');
    err.statusCode = 400;
    throw err;
  }
  const { data: existing, error: getErr } = await supabaseAdmin.auth.admin.getUserById(userId);
  if (getErr || !existing?.user) {
    const err = new Error(getErr?.message || 'User not found');
    err.statusCode = 404;
    throw err;
  }
  const { data, error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
    app_metadata: {
      ...(existing.user.app_metadata || {}),
      suspended: !!suspended,
      suspend_reason: suspended ? String(message || '').slice(0, 500) : null
    }
  });
  if (error) {
    const err = new Error(error.message);
    err.statusCode = 400;
    throw err;
  }

  let emailSent = false;
  if (existing.user.email) {
    try {
      const { sendBrevoEmail, suspendNoticeEmailHtml } = await import('../utils/brevo.js');
      const subject = suspended
        ? 'Your AFROLUXO account has been suspended'
        : 'Your AFROLUXO account has been reinstated';
      await sendBrevoEmail({
        to: existing.user.email,
        subject,
        html: suspendNoticeEmailHtml({
          name: existing.user.user_metadata?.full_name,
          suspended: !!suspended,
          message: message || ''
        })
      });
      emailSent = true;
    } catch (e) {
      console.warn('Suspend email failed:', e.message);
    }
  }

  await writeAuditLog({
    actorId: actor.id,
    actorEmail: actor.email,
    action: suspended ? 'auth.suspend_user' : 'auth.unsuspend_user',
    targetType: 'user',
    targetId: userId,
    meta: { emailSent },
    request
  });

  return { user: mapPublicUser(data.user), emailSent };
}

export async function deleteUserAccount(userId, actor, request) {
  requireSupabase();
  if (getUserRole(actor) !== 'admin') {
    const err = new Error('Only administrators can delete users');
    err.statusCode = 403;
    throw err;
  }
  if (userId === actor.id) {
    const err = new Error('You cannot delete your own account');
    err.statusCode = 400;
    throw err;
  }
  const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);
  if (error) {
    const err = new Error(error.message);
    err.statusCode = 400;
    throw err;
  }
  await writeAuditLog({
    actorId: actor.id,
    actorEmail: actor.email,
    action: 'auth.delete_user',
    targetType: 'user',
    targetId: userId,
    request
  });
  return { ok: true };
}

export async function broadcastEmailToUsers({ subject, body, audience }, actor, request) {
  requireSupabase();
  if (getUserRole(actor) !== 'admin') {
    const err = new Error('Only administrators can broadcast email');
    err.statusCode = 403;
    throw err;
  }
  const subj = String(subject || '').trim();
  const htmlBody = String(body || '').trim();
  if (subj.length < 3 || htmlBody.length < 10) {
    const err = new Error('Subject and message are required');
    err.statusCode = 400;
    throw err;
  }

  const { data, error } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 });
  if (error) {
    const err = new Error(error.message);
    err.statusCode = 500;
    throw err;
  }

  let users = data.users || [];
  if (audience === 'customers') {
    users = users.filter((u) => getUserRole(u) === 'customer');
  } else if (audience === 'staff') {
    users = users.filter((u) => ['admin', 'manager'].includes(getUserRole(u)));
  }
  users = users.filter((u) => u.email && !u.app_metadata?.suspended);

  const { sendBrevoEmail, broadcastEmailHtml } = await import('../utils/brevo.js');
  let sent = 0;
  let failed = 0;
  for (const u of users) {
    try {
      await sendBrevoEmail({
        to: u.email,
        subject: subj,
        html: broadcastEmailHtml({
          name: u.user_metadata?.full_name,
          subject: subj,
          body: htmlBody
        })
      });
      sent += 1;
    } catch {
      failed += 1;
    }
  }

  await writeAuditLog({
    actorId: actor.id,
    actorEmail: actor.email,
    action: 'auth.broadcast_email',
    targetType: 'users',
    meta: { sent, failed, audience: audience || 'all' },
    request
  });

  return { sent, failed, total: users.length };
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

async function findAuthUserByEmail(email) {
  const normalized = String(email).trim().toLowerCase();
  // Paginate lightly — fine for small shops; prefer filter when available
  let page = 1;
  const perPage = 200;
  while (page <= 10) {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({ page, perPage });
    if (error) throw error;
    const users = data?.users || [];
    const found = users.find((u) => u.email?.toLowerCase() === normalized);
    if (found) return found;
    if (users.length < perPage) break;
    page += 1;
  }
  return null;
}

/**
 * Request password reset email via Brevo.
 * Always returns a generic success message (no email enumeration).
 */
export async function requestPasswordReset(email, request) {
  requireSupabase();
  const { env } = await import('../config/env.js');
  const { createRawToken, hashToken } = await import('../utils/cryptoTokens.js');
  const { sendBrevoEmail, passwordResetEmailHtml } = await import('../utils/brevo.js');

  const normalized = String(email || '')
    .trim()
    .toLowerCase();
  if (!normalized || !normalized.includes('@')) {
    const err = new Error('Enter a valid email address');
    err.statusCode = 400;
    throw err;
  }

  const generic = {
    message: 'If an account exists for that email, a reset link has been sent.'
  };

  const user = await findAuthUserByEmail(normalized);
  if (!user) {
    await writeAuditLog({
      actorEmail: normalized,
      action: 'auth.forgot_password_unknown',
      targetType: 'user',
      request
    });
    return generic;
  }

  const rawToken = createRawToken(32);
  const tokenHash = hashToken(rawToken);
  const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString();

  // Invalidate previous unused tokens for this email
  await supabaseAdmin
    .from('password_reset_tokens')
    .update({ used_at: new Date().toISOString() })
    .eq('email', normalized)
    .is('used_at', null);

  const { error: insertErr } = await supabaseAdmin.from('password_reset_tokens').insert({
    user_id: user.id,
    email: normalized,
    token_hash: tokenHash,
    expires_at: expiresAt
  });

  if (insertErr) {
    const err = new Error(
      insertErr.message.includes('password_reset_tokens')
        ? 'Password reset table missing. Run supabase-migrate-auth-newsletter.sql'
        : insertErr.message
    );
    err.statusCode = 500;
    throw err;
  }

  const resetUrl = `${env.FRONTEND_URL}/reset-password?token=${encodeURIComponent(rawToken)}`;
  const name = user.user_metadata?.full_name || '';

  await sendBrevoEmail({
    to: normalized,
    subject: 'Reset your AFROLUXO password',
    html: passwordResetEmailHtml({ name, resetUrl }),
    text: `Reset your password: ${resetUrl}`
  });

  await writeAuditLog({
    actorId: user.id,
    actorEmail: normalized,
    action: 'auth.forgot_password_sent',
    targetType: 'user',
    targetId: user.id,
    request
  });

  return generic;
}

export async function completePasswordReset({ token, password }, request) {
  requireSupabase();
  const { hashToken } = await import('../utils/cryptoTokens.js');

  if (!token || typeof token !== 'string') {
    const err = new Error('Reset link is invalid or expired');
    err.statusCode = 400;
    throw err;
  }
  if (!password || password.length < 8) {
    const err = new Error('Password must be at least 8 characters');
    err.statusCode = 400;
    throw err;
  }

  const tokenHash = hashToken(token);
  const { data: row, error } = await supabaseAdmin
    .from('password_reset_tokens')
    .select('*')
    .eq('token_hash', tokenHash)
    .is('used_at', null)
    .maybeSingle();

  if (error || !row) {
    const err = new Error('Reset link is invalid or expired');
    err.statusCode = 400;
    throw err;
  }

  if (new Date(row.expires_at).getTime() < Date.now()) {
    const err = new Error('Reset link has expired. Request a new one.');
    err.statusCode = 400;
    throw err;
  }

  const { error: updErr } = await supabaseAdmin.auth.admin.updateUserById(row.user_id, {
    password
  });
  if (updErr) {
    const err = new Error(updErr.message);
    err.statusCode = 400;
    throw err;
  }

  await supabaseAdmin
    .from('password_reset_tokens')
    .update({ used_at: new Date().toISOString() })
    .eq('id', row.id);

  await writeAuditLog({
    actorId: row.user_id,
    actorEmail: row.email,
    action: 'auth.password_reset_completed',
    targetType: 'user',
    targetId: row.user_id,
    request
  });

  return { message: 'Password updated. You can sign in now.' };
}
