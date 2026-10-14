import { supabaseAdmin } from '../config/supabase.js';

const notConfiguredError = new Error('Supabase is not configured');

const VALID_STATUSES = [
  'pending',
  'payment_review',
  'confirmed',
  'shipped',
  'delivered',
  'cancelled'
];

const VALID_PAYMENT_STATUSES = ['awaiting_payment', 'payment_review', 'paid', 'rejected'];

export async function createOrder(payload, user) {
  if (!supabaseAdmin) {
    throw notConfiguredError;
  }

  const {
    name,
    phone,
    address,
    productId,
    notes,
    paymentMethod,
    paymentReference,
    paymentStatus
  } = payload;

  const isDemo = typeof productId === 'string' && productId.startsWith('demo-');
  const row = {
    customer_name: name,
    customer_phone: phone,
    customer_address: address,
    product_id: isDemo ? null : productId,
    notes: isDemo ? `${notes || ''} [demo:${productId}]`.trim() : notes || null,
    payment_method: paymentMethod || null,
    payment_reference: paymentReference || null,
    payment_status: paymentStatus || 'awaiting_payment',
    status: paymentStatus === 'payment_review' ? 'payment_review' : 'pending'
  };

  if (user) {
    row.user_id = user.id;
    row.user_email = user.email;
  }

  const { data, error } = await supabaseAdmin.from('orders').insert(row).select().single();

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
    .select('*, products(name, price, category, imageUrl)')
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

  const { data, error } = await supabaseAdmin
    .from('orders')
    .select('*, products(name, price, category, imageUrl)')
    .or(`user_id.eq.${user.id},user_email.eq.${user.email}`)
    .order('created_at', { ascending: false });

  if (error) {
    const err = new Error(error.message);
    err.statusCode = 500;
    throw err;
  }

  return data;
}

export async function updateOrderStatus(id, status, paymentStatus) {
  if (!supabaseAdmin) {
    throw notConfiguredError;
  }

  const updates = {};
  if (status) {
    if (!VALID_STATUSES.includes(status)) {
      const err = new Error(`Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}`);
      err.statusCode = 400;
      throw err;
    }
    updates.status = status;
    // Sync payment when admin confirms
    if (status === 'confirmed') updates.payment_status = 'paid';
    if (status === 'payment_review') updates.payment_status = 'payment_review';
    if (status === 'cancelled') updates.payment_status = 'rejected';
  }

  if (paymentStatus) {
    if (!VALID_PAYMENT_STATUSES.includes(paymentStatus)) {
      const err = new Error(
        `Invalid payment status. Must be one of: ${VALID_PAYMENT_STATUSES.join(', ')}`
      );
      err.statusCode = 400;
      throw err;
    }
    updates.payment_status = paymentStatus;
    if (paymentStatus === 'paid' && !updates.status) updates.status = 'confirmed';
    if (paymentStatus === 'payment_review' && !updates.status) updates.status = 'payment_review';
    if (paymentStatus === 'rejected' && !updates.status) updates.status = 'cancelled';
  }

  if (!Object.keys(updates).length) {
    const err = new Error('Nothing to update');
    err.statusCode = 400;
    throw err;
  }

  const { data, error } = await supabaseAdmin
    .from('orders')
    .update(updates)
    .eq('id', id)
    .select('*, products(name, price, category, imageUrl)')
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
    .update({
      proof_url: proofUrl,
      payment_status: 'payment_review',
      status: 'payment_review'
    })
    .eq('id', orderId)
    .select('*, products(name, price, category, imageUrl)')
    .single();

  if (error) {
    const err = new Error(error.message);
    err.statusCode = 400;
    throw err;
  }

  return data;
}
