-- ─────────────────────────────────────────────────────────────────────────────
-- 003_product_assets.sql — Product asset uploads + storage
-- ─────────────────────────────────────────────────────────────────────────────

-- ════════════════════════════════════════════════════════════════════════════
-- product_assets
-- Tracks a set of product images uploaded by a user before generation.
-- Status: PENDING (uploading) → READY (committed, image_urls populated)
-- ════════════════════════════════════════════════════════════════════════════
create table if not exists public.product_assets (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid references auth.users(id) on delete cascade not null,
  status       text not null default 'PENDING',   -- 'PENDING' | 'READY'
  image_urls   text[] not null default '{}',
  storage_paths text[] not null default '{}',     -- raw storage paths for audit
  created_at   timestamptz not null default now()
);

alter table public.product_assets enable row level security;

drop policy if exists "product_assets_select_own" on public.product_assets;
drop policy if exists "product_assets_insert_own" on public.product_assets;
drop policy if exists "product_assets_update_own" on public.product_assets;
drop policy if exists "product_assets_delete_own" on public.product_assets;

create policy "product_assets_select_own" on public.product_assets
  for select to authenticated using (auth.uid() = user_id);

create policy "product_assets_insert_own" on public.product_assets
  for insert to authenticated with check (auth.uid() = user_id);

create policy "product_assets_update_own" on public.product_assets
  for update to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "product_assets_delete_own" on public.product_assets
  for delete to authenticated using (auth.uid() = user_id);

create index if not exists product_assets_user_id_idx
  on public.product_assets (user_id);

-- ════════════════════════════════════════════════════════════════════════════
-- generation_requests — add image columns
-- ════════════════════════════════════════════════════════════════════════════
alter table public.generation_requests
  add column if not exists product_asset_id uuid references public.product_assets(id),
  add column if not exists product_image_urls text[] not null default '{}';

-- ════════════════════════════════════════════════════════════════════════════
-- Storage bucket: product-images
--
-- Run these statements in the Supabase SQL editor. The INSERT into
-- storage.buckets creates the bucket if it does not exist. If you prefer
-- the Dashboard, create a public bucket named "product-images" manually.
-- ════════════════════════════════════════════════════════════════════════════
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'product-images',
  'product-images',
  true,
  5242880,   -- 5 MB per file
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Storage RLS: users can only upload into their own folder (user_id prefix)
drop policy if exists "product_images_public_read"   on storage.objects;
drop policy if exists "product_images_owner_insert"  on storage.objects;
drop policy if exists "product_images_owner_delete"  on storage.objects;

create policy "product_images_public_read" on storage.objects
  for select to public
  using (bucket_id = 'product-images');

create policy "product_images_owner_insert" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'product-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "product_images_owner_delete" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'product-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
