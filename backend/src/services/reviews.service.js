import { supabaseAdmin } from '../config/supabase.js';
import { createClient } from '@supabase/supabase-js';
import { env } from '../config/env.js';

const notConfiguredError = new Error('Supabase is not configured');
notConfiguredError.statusCode = 503;

function missingReviewSchemaError(error, table) {
  const missing =
    error?.code === '42P01' ||
    error?.code === 'PGRST205' ||
    /relation .* does not exist|could not find the table .*schema cache/i.test(error?.message || '');
  if (!missing) return null;

  const err = new Error(
    `Reviews are not configured because public.${table} is missing. Run supabase-migrate-reviews-likes.sql in the Supabase SQL Editor for this backend's project, then retry.`,
  );
  err.statusCode = 503;
  return err;
}

export async function listReviewsForProduct(productId, { includeHidden = false } = {}) {
  if (!supabaseAdmin) throw notConfiguredError;
  let q = supabaseAdmin
    .from('product_reviews')
    .select('*')
    .eq('product_id', productId)
    .order('created_at', { ascending: false });
  if (!includeHidden) q = q.eq('is_visible', true);
  const { data, error } = await q;
  if (error) {
    const schemaError = missingReviewSchemaError(error, 'product_reviews');
    if (schemaError) throw schemaError;
    console.warn('listReviews:', error.message);
    const err = new Error('Could not load reviews. Please try again.');
    err.statusCode = 500;
    throw err;
  }
  return data || [];
}

/** Aggregate visible reviews for product cards: { [productId]: { reviewCount, avgRating } } */
export async function getReviewStatsByProductIds(productIds = []) {
  const ids = [...new Set((productIds || []).filter(Boolean))];
  const empty = {};
  if (!supabaseAdmin || ids.length === 0) return empty;

  const { data, error } = await supabaseAdmin
    .from('product_reviews')
    .select('product_id, rating')
    .eq('is_visible', true)
    .in('product_id', ids);

  if (error) {
    console.warn('getReviewStats:', error.message);
    return empty;
  }

  const map = {};
  for (const row of data || []) {
    const id = row.product_id;
    if (!map[id]) map[id] = { sum: 0, n: 0 };
    map[id].sum += Number(row.rating) || 0;
    map[id].n += 1;
  }

  const out = {};
  for (const id of Object.keys(map)) {
    const { sum, n } = map[id];
    out[id] = {
      reviewCount: n,
      avgRating: n ? Math.round((sum / n) * 10) / 10 : 0
    };
  }
  return out;
}

export async function attachReviewStats(products = []) {
  if (!Array.isArray(products) || products.length === 0) return products;
  const stats = await getReviewStatsByProductIds(products.map((p) => p.id));
  return products.map((p) => ({
    ...p,
    reviewCount: stats[p.id]?.reviewCount || 0,
    avgRating: stats[p.id]?.avgRating || 0
  }));
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

export async function createReview(productId, payload, user, accessToken) {
  if (!supabaseAdmin) throw notConfiguredError;
  const supabaseUser = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
    global: { headers: { Authorization: `Bearer ${accessToken}` } }
  });
  const rating = Math.min(5, Math.max(1, parseInt(payload.rating, 10) || 5));
  const bodyRaw = String(payload.body || '').trim();
  // Star-only reviews are allowed; comment is optional
  const body = (bodyRaw || `Rated ${rating} stars`).slice(0, 2000);

  const { data, error } = await supabaseUser
    .from('product_reviews')
    .insert({
      product_id: productId,
      user_id: user.id,
      user_email: user.email,
      user_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Customer',
      rating,
      title: String(payload.title || '').trim().slice(0, 120) || null,
      body,
      is_visible: true
    })
    .select()
    .single();

  if (error) {
    const msg = error.message || 'Could not save review';
    const schemaError = missingReviewSchemaError(error, 'product_reviews');
    if (schemaError) throw schemaError;
    if (error.code === '42501') {
      console.error('createReview: database rejected the review under row-level security');
      const err = new Error('Reviews are temporarily unavailable. Please try again later.');
      err.statusCode = 503;
      throw err;
    }
    const err = new Error(msg);
    err.statusCode = error.code === '23503' ? 404 : 400;
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
  const { data: existing, error: lookupError } = await supabaseAdmin
    .from('product_likes')
    .select('id')
    .eq('product_id', productId)
    .eq('user_id', userId)
    .maybeSingle();

  if (lookupError) {
    const schemaError = missingReviewSchemaError(lookupError, 'product_likes');
    if (schemaError) throw schemaError;
    const err = new Error('Could not update this like. Please try again.');
    err.statusCode = 500;
    throw err;
  }

  if (existing?.id) {
    const { error } = await supabaseAdmin.from('product_likes').delete().eq('id', existing.id);
    if (error) {
      const err = new Error(error.message);
      err.statusCode = 500;
      throw err;
    }
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
  if (!supabaseAdmin) throw notConfiguredError;
  const { count, error: countError } = await supabaseAdmin
    .from('product_likes')
    .select('id', { count: 'exact', head: true })
    .eq('product_id', productId);
  if (countError) {
    const schemaError = missingReviewSchemaError(countError, 'product_likes');
    if (schemaError) throw schemaError;
    const err = new Error('Could not load product likes.');
    err.statusCode = 500;
    throw err;
  }
  let liked = false;
  if (userId) {
    const { data, error } = await supabaseAdmin
      .from('product_likes')
      .select('id')
      .eq('product_id', productId)
      .eq('user_id', userId)
      .maybeSingle();
    if (error) {
      const schemaError = missingReviewSchemaError(error, 'product_likes');
      if (schemaError) throw schemaError;
      const err = new Error('Could not load product likes.');
      err.statusCode = 500;
      throw err;
    }
    liked = !!data?.id;
  }
  return { count: count || 0, liked };
}
