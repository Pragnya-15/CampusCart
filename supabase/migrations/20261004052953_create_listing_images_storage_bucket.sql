/*
# Create listing-images storage bucket

## Overview
Creates a public storage bucket for listing images so users can upload
product photos when creating listings. The bucket is public-readable
but only authenticated users can upload to their own folder.

## Storage Bucket
- Name: `listing-images`
- Public: true (anyone can view images)
- File size limit: 5MB (enforced in frontend)

## Storage Policies
- SELECT (read): public — anyone can view listing images
- INSERT (upload): authenticated users only, files must be in their own user folder
- UPDATE: authenticated users only, own folder
- DELETE: authenticated users only, own folder
*/

INSERT INTO storage.buckets (id, name, public)
VALUES ('listing-images', 'listing-images', true)
ON CONFLICT (id) DO NOTHING;

-- Public read access for listing images
DROP POLICY IF EXISTS "listing_images_public_read" ON storage.objects;
CREATE POLICY "listing_images_public_read"
ON storage.objects FOR SELECT
TO anon, authenticated
USING (bucket_id = 'listing-images');

-- Authenticated users can upload to their own folder
DROP POLICY IF EXISTS "listing_images_upload_own" ON storage.objects;
CREATE POLICY "listing_images_upload_own"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'listing-images' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Authenticated users can update their own files
DROP POLICY IF EXISTS "listing_images_update_own" ON storage.objects;
CREATE POLICY "listing_images_update_own"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'listing-images' AND (storage.foldername(name))[1] = auth.uid()::text)
WITH CHECK (bucket_id = 'listing-images' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Authenticated users can delete their own files
DROP POLICY IF EXISTS "listing_images_delete_own" ON storage.objects;
CREATE POLICY "listing_images_delete_own"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'listing-images' AND (storage.foldername(name))[1] = auth.uid()::text);
