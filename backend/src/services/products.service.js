import { supabaseAdmin } from '../config/supabase.js';

const notConfiguredError = new Error('Supabase is not configured');

export async function listProducts({ category, search }) {
  if (!supabaseAdmin) {
    return [];
  }

  try {
    let query = supabaseAdmin.from('products').select('*').eq('is_active', true);

    if (category) {
      query = query.eq('category', category);
    }

    if (search) {
      query = query.ilike('name', `%${search}%`);
    }

    const { data, error } = await query;

    if (error) {
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

  const { data, error } = await supabaseAdmin
    .from('products')
    .insert({ ...product, imageUrls: product.imageUrls || [], is_active: true })
    .select()
    .single();

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

  const { data, error } = await supabaseAdmin
    .from('products')
    .update(updates)
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

