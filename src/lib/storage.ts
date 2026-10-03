import { supabase } from './supabase';

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

export async function uploadImage(
  file: File,
  folder: string
): Promise<string> {
  if (file.size > MAX_FILE_SIZE) {
    throw new Error('Image must be under 5MB.');
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new Error('Only JPEG, PNG, WebP, and GIF images are allowed.');
  }

  const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
  const fileName = `${folder}/${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${ext}`;

  const { error } = await supabase.storage
    .from('studio-images')
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: false,
    });

  if (error) {
    throw new Error(error.message);
  }

  const { data } = supabase.storage.from('studio-images').getPublicUrl(fileName);
  if (!data.publicUrl) {
    throw new Error('The uploaded image URL was not created.');
  }
  return data.publicUrl;
}

export async function deleteImage(url: string): Promise<void> {
  if (!url) return;
  try {
    const match = url.match(/\/studio-images\/(.+)$/);
    if (!match) return;
    const path = match[1];
    await supabase.storage.from('studio-images').remove([path]);
  } catch {
    // Best-effort cleanup — don't block the operation if deletion fails
  }
}
