import { supabaseAdmin } from '../config/supabase.js';

const notConfiguredError = new Error('Supabase is not configured');

function normalizeProductInput(input = {}) {
  const imageUrls = Array.isArray(input.imageUrls)
    ? input.imageUrls.filter((u) => typeof u === 'string' && u.trim())
    : [];
  const imageUrl =
    (typeof input.imageUrl === 'string' && input.imageUrl.trim()) || imageUrls[0] || '';

  const row = {
    name: String(input.name || '').trim(),
    description: input.description != null ? String(input.description) : '',
    price: Number(input.price) || 0,
    category: String(input.category || '').trim(),
    stock: Math.max(0, parseInt(input.stock, 10) || 0),
    is_active: input.is_active !== false,
    imageUrl,
    imageUrls: imageUrls.length ? imageUrls : imageUrl ? [imageUrl] : []
  };

  if (input.subcategory) row.subcategory = String(input.subcategory).trim();
  if (input.size) row.size = String(input.size).trim();

  return row;
}

export async function listProducts({ category, subcategory, search }) {
  if (!supabaseAdmin) {
    return [];
  }

  try {
    let query = supabaseAdmin.from('products').select('*').eq('is_active', true);

    if (category) {
      query = query.eq('category', category);
    }

    if (subcategory) {
      query = query.eq('subcategory', subcategory);
    }

    if (search) {
      query = query.ilike('name', `%${search}%`);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
      // created_at may be missing on older schemas — retry without order
      if (/created_at/i.test(error.message || '')) {
        const retry = await supabaseAdmin.from('products').select('*').eq('is_active', true);
        if (retry.error) {
          console.warn('listProducts:', retry.error.message);
          return [];
        }
        return retry.data || [];
      }
      console.warn('listProducts:', error.message);
      return [];
    }

    return data || [];
  } catch (err) {
    console.warn('listProducts unreachable:', err?.message || err);
    return [];
  }
}

export async function createProduct(product) {
  if (!supabaseAdmin) {
    throw notConfiguredError;
  }

  const row = normalizeProductInput(product);
  if (!row.name || !row.category) {
    const err = new Error('Name and category are required');
    err.statusCode = 400;
    throw err;
  }

  const { data, error } = await supabaseAdmin.from('products').insert(row).select().single();

  if (error) {
    const err = new Error(error.message);
    err.statusCode = 400;
    throw err;
  }

  return data;
}

export async function updateProduct(id, updates) {
  if (!supabaseAdmin) {
    throw notConfiguredError;
  }

  const row = normalizeProductInput({ ...updates, name: updates.name ?? 'x' });
  // For partial updates, only set provided fields
  const patch = {};
  if (updates.name != null) patch.name = row.name;
  if (updates.description != null) patch.description = row.description;
  if (updates.price != null) patch.price = row.price;
  if (updates.category != null) patch.category = row.category;
  if (updates.subcategory !== undefined) patch.subcategory = updates.subcategory || null;
  if (updates.size !== undefined) patch.size = updates.size || null;
  if (updates.stock != null) patch.stock = row.stock;
  if (updates.is_active != null) patch.is_active = row.is_active;
  if (updates.imageUrl != null || updates.imageUrls != null) {
    patch.imageUrl = row.imageUrl;
    patch.imageUrls = row.imageUrls;
  }

  const { data, error } = await supabaseAdmin
    .from('products')
    .update(patch)
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

export async function deleteProduct(id) {
  if (!supabaseAdmin) {
    throw notConfiguredError;
  }

  const { error } = await supabaseAdmin.from('products').delete().eq('id', id);

  if (error) {
    const err = new Error(error.message);
    err.statusCode = 400;
    throw err;
  }
}

export async function getProductById(id) {
  if (!supabaseAdmin) {
    throw notConfiguredError;
  }

  const { data, error } = await supabaseAdmin.from('products').select('*').eq('id', id).single();
  if (error) {
    const err = new Error(error.message);
    err.statusCode = 404;
    throw err;
  }
  return data;
}
