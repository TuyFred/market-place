import { supabaseAdmin } from '../config/supabase.js';

const notConfiguredError = new Error('Supabase is not configured');

export async function registerCustomer(payload) {
  if (!supabaseAdmin) {
    throw notConfiguredError;
  }

  const {
    fullName,
    email,
    password,
    confirmPassword,
    contactNumber,
    address
  } = payload;

  if (password !== confirmPassword) {
    const err = new Error('Passwords do not match');
    err.statusCode = 400;
    throw err;
  }

  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      full_name: fullName,
      contact_number: contactNumber,
      address,
      role: 'customer'
    }
  });

  if (error) {
    const err = new Error(error.message);
    err.statusCode = 400;
    throw err;
  }

  return {
    id: data.user.id,
    email: data.user.email,
    role: data.user.user_metadata?.role || 'customer'
  };
}

export async function loginUser({ email, password }) {
  if (!supabaseAdmin) {
    throw notConfiguredError;
  }

  const { data, error } = await supabaseAdmin.auth.signInWithPassword({
    email,
    password
  });

  if (error || !data.session || !data.user) {
    const err = new Error('Invalid email or password');
    err.statusCode = 401;
    throw err;
  }

  const role = data.user.user_metadata?.role || 'customer';

  return {
    accessToken: data.session.access_token,
    user: {
      id: data.user.id,
      email: data.user.email,
      role,
      fullName: data.user.user_metadata?.full_name || ''
    }
  };
}

export async function getUserFromToken(accessToken) {
  if (!supabaseAdmin) {
    throw notConfiguredError;
  }

  const { data, error } = await supabaseAdmin.auth.getUser(accessToken);

  if (error || !data.user) {
    const err = new Error('Invalid or expired token');
    err.statusCode = 401;
    throw err;
  }

  return data.user;
}

/* ───── User management (admin only) ───── */

export async function listUsers() {
  if (!supabaseAdmin) {
    throw notConfiguredError;
  }

  const { data, error } = await supabaseAdmin.auth.admin.listUsers();

  if (error) {
    const err = new Error(error.message);
    err.statusCode = 500;
    throw err;
  }

  return (data.users || []).map((u) => ({
    id: u.id,
    email: u.email,
    role: u.user_metadata?.role || 'customer',
    fullName: u.user_metadata?.full_name || '',
    createdAt: u.created_at
  }));
}

export async function updateUserRole(userId, role) {
  if (!supabaseAdmin) {
    throw notConfiguredError;
  }

  const validRoles = ['admin', 'manager', 'customer'];
  if (!validRoles.includes(role)) {
    const err = new Error(`Invalid role. Must be one of: ${validRoles.join(', ')}`);
    err.statusCode = 400;
    throw err;
  }

  const { data, error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
    user_metadata: { role }
  });

  if (error) {
    const err = new Error(error.message);
    err.statusCode = 400;
    throw err;
  }

  return {
    id: data.user.id,
    email: data.user.email,
    role: data.user.user_metadata?.role || 'customer',
    fullName: data.user.user_metadata?.full_name || ''
  };
}
