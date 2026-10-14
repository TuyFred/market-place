import { supabaseAdmin } from '../config/supabase.js';
import path from 'path';
import { randomUUID } from 'crypto';

const IMAGE_MIMES = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif'
]);

const VIDEO_MIMES = new Set(['video/mp4', 'video/webm', 'video/quicktime']);

const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5 MB
const MAX_VIDEO_BYTES = 40 * 1024 * 1024; // 40 MB
const MAX_PROOF_BYTES = 5 * 1024 * 1024;

function assertAllowed({ mimetype, size, bucket }) {
  const mime = (mimetype || '').toLowerCase();

  if (bucket === 'order-proofs' || bucket === 'product-images') {
    if (!IMAGE_MIMES.has(mime)) {
      const err = new Error('Only JPEG, PNG, WebP, or GIF images are allowed');
      err.statusCode = 400;
      throw err;
    }
    if (size != null && size > MAX_IMAGE_BYTES && bucket === 'product-images') {
      const err = new Error('Image must be 5 MB or smaller');
      err.statusCode = 400;
      throw err;
    }
    if (size != null && size > MAX_PROOF_BYTES && bucket === 'order-proofs') {
      const err = new Error('Proof image must be 5 MB or smaller');
      err.statusCode = 400;
      throw err;
    }
    return;
  }

  // hero / settings videos
  if (IMAGE_MIMES.has(mime)) {
    if (size != null && size > MAX_IMAGE_BYTES) {
      const err = new Error('Image must be 5 MB or smaller');
      err.statusCode = 400;
      throw err;
    }
    return;
  }
  if (VIDEO_MIMES.has(mime)) {
    if (size != null && size > MAX_VIDEO_BYTES) {
      const err = new Error('Video must be 40 MB or smaller');
      err.statusCode = 400;
      throw err;
    }
    return;
  }

  const err = new Error('File type not allowed');
  err.statusCode = 400;
  throw err;
}

function safeExtension(filename, mimetype) {
  const fromName = path.extname(filename || '').toLowerCase().replace(/[^a-z0-9.]/g, '');
  if (fromName && fromName.length <= 8) return fromName;
  if (mimetype?.includes('png')) return '.png';
  if (mimetype?.includes('webp')) return '.webp';
  if (mimetype?.includes('gif')) return '.gif';
  if (mimetype?.includes('mp4')) return '.mp4';
  if (mimetype?.includes('webm')) return '.webm';
  return '.jpg';
}

export async function uploadImage(
  fileStream,
  mimetype,
  filename,
  bucket = 'product-images',
  size
) {
  if (!supabaseAdmin) {
    throw new Error('Supabase is not configured');
  }

  assertAllowed({ mimetype, size, bucket });

  const ext = safeExtension(filename, mimetype);
  const safeName = `${Date.now()}-${randomUUID()}${ext}`;

  const { data, error } = await supabaseAdmin.storage
    .from(bucket)
    .upload(safeName, fileStream, {
      upsert: false,
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
