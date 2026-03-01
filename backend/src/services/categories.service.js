import { supabaseAdmin } from '../config/supabase.js';

const notConfiguredError = new Error('Supabase is not configured');

export async function listCategories() {
  if (!supabaseAdmin) {
    throw notConfiguredError;
  }

  const { data, error } = await supabaseAdmin
    .from('categories')
    .select('*')
    .order('name', { ascending: true });

  if (error) {
    const err = new Error(error.message);
    err.statusCode = 500;
    throw err;
  }

  return data;
}

export async function createCategory({ name, slug }) {
  if (!supabaseAdmin) {
    throw notConfiguredError;
  }

  const { data, error } = await supabaseAdmin
    .from('categories')
    .insert({ name, slug })
    .select()
    .single();

  if (error) {
    const err = new Error(error.message);
    err.statusCode = 400;
    throw err;
  }

  return data;
}

export async function updateCategory(id, { name, slug }) {
  if (!supabaseAdmin) {
    throw notConfiguredError;
  }

  const updates = {};
  if (name !== undefined) updates.name = name;
  if (slug !== undefined) updates.slug = slug;

  const { data, error } = await supabaseAdmin
    .from('categories')
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

export async function deleteCategory(id) {
  if (!supabaseAdmin) {
    throw notConfiguredError;
  }

  const { error } = await supabaseAdmin.from('categories').delete().eq('id', id);

  if (error) {
    const err = new Error(error.message);
    err.statusCode = 400;
    throw err;
  }
}
