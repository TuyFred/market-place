import { supabaseAdmin } from '../config/supabase.js';

const notConfiguredError = new Error('Supabase is not configured');

export async function createOrder(payload, user) {
  if (!supabaseAdmin) {
    throw notConfiguredError;
  }

  const { name, phone, address, productId, notes } = payload;

  const row = {
    customer_name: name,
    customer_phone: phone,
    customer_address: address,
    product_id: productId,
    notes
  };

  if (user) {
    row.user_id = user.id;
    row.user_email = user.email;
  }

  const { data, error } = await supabaseAdmin
    .from('orders')
    .insert(row)
    .select()
    .single();

  if (error) {
    const err = new Error(error.message);
    err.statusCode = 400;
    throw err;
  }

  return data;
}

export async function listOrders() {
  if (!supabaseAdmin) {
    throw notConfiguredError;
  }

  const { data, error } = await supabaseAdmin
    .from('orders')
    .select('*, products(name, price, category)')
    .order('created_at', { ascending: false });

  if (error) {
    const err = new Error(error.message);
    err.statusCode = 500;
    throw err;
  }

  return data;
}

export async function listOrdersForUser(user) {
  if (!supabaseAdmin) {
    throw notConfiguredError;
  }

  // Return orders for the user by user_id OR by matching user_email (covers orders created before login)
  const { data, error } = await supabaseAdmin
    .from('orders')
    .select('*, products(name, price, category)')
    .or(`user_id.eq.${user.id},user_email.eq.${user.email}`)
    .order('created_at', { ascending: false });

  if (error) {
    const err = new Error(error.message);
    err.statusCode = 500;
    throw err;
  }

  return data;
}

export async function updateOrderStatus(id, status) {
  if (!supabaseAdmin) {
    throw notConfiguredError;
  }

  const validStatuses = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];
  if (!validStatuses.includes(status)) {
    const err = new Error(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
    err.statusCode = 400;
    throw err;
  }

  const { data, error } = await supabaseAdmin
    .from('orders')
    .update({ status })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    const err = new Error(error.message);
    err.statusCode = 400;
    throw err;
  }

  return data;
}

export async function uploadOrderProof(orderId, proofUrl) {
  if (!supabaseAdmin) {
    throw notConfiguredError;
  }

  const { data, error } = await supabaseAdmin
    .from('orders')
    .update({ proof_url: proofUrl })
    .eq('id', orderId)
    .select()
    .single();

  if (error) {
    const err = new Error(error.message);
    err.statusCode = 400;
    throw err;
  }

  return data;
}
