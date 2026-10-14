import { supabaseAdmin } from '../config/supabase.js';

const notConfiguredError = new Error('Supabase is not configured');

function slugify(text) {
  return String(text || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export async function listCategories() {
  if (!supabaseAdmin) {
    return [];
  }

  try {
    const { data, error } = await supabaseAdmin
      .from('categories')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      console.warn('listCategories:', error.message);
      return [];
    }

    return data || [];
  } catch (err) {
    console.warn('listCategories unreachable:', err?.message || err);
    return [];
  }
}

export async function createCategory({ name, slug, parent_id }) {
  if (!supabaseAdmin) {
    throw notConfiguredError;
  }

  const row = {
    name: String(name).trim(),
    slug: slug ? slugify(slug) : slugify(name),
    parent_id: parent_id || null
  };

  const { data, error } = await supabaseAdmin.from('categories').insert(row).select().single();

  if (error) {
    const err = new Error(error.message);
    err.statusCode = 400;
    throw err;
  }

  return data;
}

export async function updateCategory(id, { name, slug, parent_id }) {
  if (!supabaseAdmin) {
    throw notConfiguredError;
  }

  const updates = {};
  if (name !== undefined) updates.name = String(name).trim();
  if (slug !== undefined) updates.slug = slugify(slug);
  if (parent_id !== undefined) updates.parent_id = parent_id || null;

  // Prevent category becoming its own parent
  if (updates.parent_id === id) {
    const err = new Error('A category cannot be its own parent');
    err.statusCode = 400;
    throw err;
  }

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

  // Clear children parent first
  await supabaseAdmin.from('categories').update({ parent_id: null }).eq('parent_id', id);

  const { error } = await supabaseAdmin.from('categories').delete().eq('id', id);

  if (error) {
    const err = new Error(error.message);
    err.statusCode = 400;
    throw err;
  }
}
