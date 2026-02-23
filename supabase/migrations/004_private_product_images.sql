-- ─────────────────────────────────────────────────────────────────────────────
-- 004_private_product_images.sql — Make product-images bucket private
-- ─────────────────────────────────────────────────────────────────────────────

-- Make the bucket private (no public URLs)
update storage.buckets
set public = false
where id = 'product-images';

-- Drop the old public-read policy
drop policy if exists "product_images_public_read" on storage.objects;

-- Replace with an authenticated owner-only select policy
drop policy if exists "product_images_owner_select" on storage.objects;

create policy "product_images_owner_select" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'product-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
