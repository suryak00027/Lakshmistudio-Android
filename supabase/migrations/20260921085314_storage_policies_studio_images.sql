/*
# Storage policies for studio-images bucket

## Changes
- Allow anon + authenticated to read, upload, and delete files in the studio-images bucket.
- Single-tenant app, so all images are intentionally public/shared.
*/

CREATE POLICY "anon_read_studio_images" ON storage.objects
  FOR SELECT TO anon, authenticated
  USING (bucket_id = 'studio-images');

CREATE POLICY "anon_insert_studio_images" ON storage.objects
  FOR INSERT TO anon, authenticated
  WITH CHECK (bucket_id = 'studio-images');

CREATE POLICY "anon_update_studio_images" ON storage.objects
  FOR UPDATE TO anon, authenticated
  USING (bucket_id = 'studio-images')
  WITH CHECK (bucket_id = 'studio-images');

CREATE POLICY "anon_delete_studio_images" ON storage.objects
  FOR DELETE TO anon, authenticated
  USING (bucket_id = 'studio-images');
