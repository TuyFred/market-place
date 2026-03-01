import { supabaseAdmin } from '../config/supabase.js';

export async function uploadImage(
  fileStream,
  mimetype,
  filename,
  bucket = 'product-images'
) {
  if (!supabaseAdmin) {
    throw new Error('Supabase is not configured');
  }

  const { data, error } = await supabaseAdmin.storage
    .from(bucket)
    .upload(filename, fileStream, {
      upsert: true,
      contentType: mimetype || 'image/jpeg'
    });

  if (error) {
    const err = new Error(error.message);
    err.statusCode = 400;
    throw err;
  }

  const {
    data: { publicUrl }
  } = supabaseAdmin.storage.from(bucket).getPublicUrl(data.path);

  return publicUrl;
}

