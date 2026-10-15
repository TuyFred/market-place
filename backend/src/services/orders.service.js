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

function parseQty(value) {
  const n = Number(value);
  if (!Number.isFinite(n) || n < 1) return 1;
  return Math.min(Math.floor(n), 99);
}

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
    paymentStatus,
    quantity: rawQty
  } = payload;

  const quantity = parseQty(rawQty);
  const isDemo = typeof productId === 'string' && productId.startsWith('demo-');

  if (!isDemo && productId) {
    const { data: product, error: prodErr } = await supabaseAdmin
      .from('products')
      .select('id, name, stock, is_active, price')
      .eq('id', productId)
      .single();

    if (prodErr || !product) {
      const err = new Error('Product not found');
      err.statusCode = 404;
      throw err;
    }

    if (product.is_active === false) {
      const err = new Error('This product is no longer available');
      err.statusCode = 400;
      throw err;
    }

    const stock = Number(product.stock ?? 0);
    if (stock < quantity) {
      const err = new Error(
        stock <= 0
          ? `"${product.name}" is out of stock`
          : `Only ${stock} left for "${product.name}"`
      );
      err.statusCode = 400;
      throw err;
    }

    const nextStock = stock - quantity;
    const { error: stockErr } = await supabaseAdmin
      .from('products')
      .update({ stock: nextStock })
      .eq('id', productId)
      .gte('stock', quantity);

    if (stockErr) {
      const err = new Error(stockErr.message || 'Could not update stock');
      err.statusCode = 400;
      throw err;
    }
  }

  const row = {
    customer_name: name,
    customer_phone: phone,
    customer_address: address,
    product_id: isDemo ? null : productId,
    quantity,
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

  let { data, error } = await supabaseAdmin.from('orders').insert(row).select().single();

  // Older DBs without quantity column — retry without it
  if (error && /quantity/i.test(error.message || '')) {
    const { quantity: _q, ...legacy } = row;
    ({ data, error } = await supabaseAdmin.from('orders').insert(legacy).select().single());
  }

  if (error) {
    // Best-effort restore stock if order insert failed after decrement
    if (!isDemo && productId) {
      try {
        const { data: p } = await supabaseAdmin
          .from('products')
          .select('stock')
          .eq('id', productId)
          .single();
        if (p) {
          await supabaseAdmin
            .from('products')
            .update({ stock: Number(p.stock || 0) + quantity })
            .eq('id', productId);
        }
      } catch {
        /* ignore restore failure */
      }
    }
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
    .select('*, products(name, price, category, imageUrl, stock)')
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

async function restoreStockForOrder(order) {
  if (!order?.product_id) return;
  const qty = parseQty(order.quantity || 1);
  const { data: p } = await supabaseAdmin
    .from('products')
    .select('stock')
    .eq('id', order.product_id)
    .single();
  if (!p) return;
  await supabaseAdmin
    .from('products')
    .update({ stock: Number(p.stock || 0) + qty })
    .eq('id', order.product_id);
}

export async function updateOrderStatus(id, status, paymentStatus) {
  if (!supabaseAdmin) {
    throw notConfiguredError;
  }

  const { data: existing } = await supabaseAdmin
    .from('orders')
    .select('id, product_id, quantity, status')
    .eq('id', id)
    .single();

  const updates = {};
  if (status) {
    if (!VALID_STATUSES.includes(status)) {
      const err = new Error(`Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}`);
      err.statusCode = 400;
      throw err;
    }
    updates.status = status;
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

  const becomingCancelled =
    updates.status === 'cancelled' && existing && existing.status !== 'cancelled';

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

  if (becomingCancelled && existing) {
    try {
      await restoreStockForOrder(existing);
    } catch {
      /* non-fatal */
    }
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
