/*
# Add photo_url to staff and logo_url to settings

## Changes
1. `staff` table: add `photo_url` text column (nullable) for staff profile photos
2. `settings` table: add `logo_url` text column (nullable) for studio logo
3. `staff` table: add `custom_role` text column (nullable) for custom staff roles

## Security
- No RLS policy changes needed — existing policies already allow full access.
*/

ALTER TABLE staff ADD COLUMN IF NOT EXISTS photo_url text DEFAULT '';
ALTER TABLE staff ADD COLUMN IF NOT EXISTS custom_role text DEFAULT '';
ALTER TABLE settings ADD COLUMN IF NOT EXISTS logo_url text DEFAULT '';
