import { supabaseAdmin } from '../config/supabase.js';

const notConfiguredError = new Error('Supabase is not configured');

export async function listReviewsForProduct(productId, { includeHidden = false } = {}) {
  if (!supabaseAdmin) return [];
  let q = supabaseAdmin
    .from('product_reviews')
    .select('*')
    .eq('product_id', productId)
    .order('created_at', { ascending: false });
  if (!includeHidden) q = q.eq('is_visible', true);
  const { data, error } = await q;
  if (error) {
    console.warn('listReviews:', error.message);
    return [];
  }
  return data || [];
}

export async function listAllReviews() {
  if (!supabaseAdmin) throw notConfiguredError;
  const { data, error } = await supabaseAdmin
    .from('product_reviews')
    .select('*, products(name, imageUrl)')
    .order('created_at', { ascending: false })
    .limit(200);
  if (error) {
    const err = new Error(error.message);
    err.statusCode = 500;
    throw err;
  }
  return data || [];
}

export async function createReview(productId, payload, user) {
  if (!supabaseAdmin) throw notConfiguredError;
  const rating = Math.min(5, Math.max(1, parseInt(payload.rating, 10) || 5));
  const body = String(payload.body || '').trim();
  if (body.length < 5) {
    const err = new Error('Review must be at least 5 characters');
    err.statusCode = 400;
    throw err;
  }

  const { data, error } = await supabaseAdmin
    .from('product_reviews')
    .insert({
      product_id: productId,
      user_id: user.id,
      user_email: user.email,
      user_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Customer',
      rating,
      title: String(payload.title || '').trim().slice(0, 120) || null,
      body: body.slice(0, 2000),
      is_visible: true
    })
    .select()
    .single();

  if (error) {
    const err = new Error(error.message);
    err.statusCode = 400;
    throw err;
  }
  return data;
}

export async function setReviewVisibility(id, isVisible) {
  if (!supabaseAdmin) throw notConfiguredError;
  const { data, error } = await supabaseAdmin
    .from('product_reviews')
    .update({ is_visible: !!isVisible })
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

export async function deleteReview(id) {
  if (!supabaseAdmin) throw notConfiguredError;
  const { error } = await supabaseAdmin.from('product_reviews').delete().eq('id', id);
  if (error) {
    const err = new Error(error.message);
    err.statusCode = 400;
    throw err;
  }
}

export async function toggleLike(productId, userId) {
  if (!supabaseAdmin) throw notConfiguredError;
  const { data: existing } = await supabaseAdmin
    .from('product_likes')
    .select('id')
    .eq('product_id', productId)
    .eq('user_id', userId)
    .maybeSingle();

  if (existing?.id) {
    await supabaseAdmin.from('product_likes').delete().eq('id', existing.id);
    return { liked: false };
  }

  const { error } = await supabaseAdmin.from('product_likes').insert({
    product_id: productId,
    user_id: userId
  });
  if (error) {
    const err = new Error(error.message);
    err.statusCode = 400;
    throw err;
  }
  return { liked: true };
}

export async function getLikeStats(productId, userId) {
  if (!supabaseAdmin) return { count: 0, liked: false };
  const { count } = await supabaseAdmin
    .from('product_likes')
    .select('id', { count: 'exact', head: true })
    .eq('product_id', productId);
  let liked = false;
  if (userId) {
    const { data } = await supabaseAdmin
      .from('product_likes')
      .select('id')
      .eq('product_id', productId)
      .eq('user_id', userId)
      .maybeSingle();
    liked = !!data?.id;
  }
  return { count: count || 0, liked };
}
