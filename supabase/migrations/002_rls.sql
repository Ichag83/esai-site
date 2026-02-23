-- ─────────────────────────────────────────────────────────────────────────────
-- 002_rls.sql — Explicit RLS policies for all Creative Brain BR tables
--
-- Run this after 001_initial.sql if you need to recreate or audit policies.
-- All "drop if exists" guards make it safe to re-run.
-- ─────────────────────────────────────────────────────────────────────────────

-- ════════════════════════════════════════════════════════════════════════════
-- creatives
-- ════════════════════════════════════════════════════════════════════════════
alter table public.creatives enable row level security;

-- Drop and recreate so this file is idempotent
drop policy if exists "creatives_select_own"  on public.creatives;
drop policy if exists "creatives_insert_own"  on public.creatives;
drop policy if exists "creatives_update_own"  on public.creatives;
drop policy if exists "creatives_delete_own"  on public.creatives;

-- SELECT: authenticated user can only read their own rows
create policy "creatives_select_own" on public.creatives
  for select
  to authenticated
  using (auth.uid() = user_id);

-- INSERT: authenticated user can only insert rows that belong to themselves
create policy "creatives_insert_own" on public.creatives
  for insert
  to authenticated
  with check (auth.uid() = user_id);

-- UPDATE: authenticated user can only update their own rows
create policy "creatives_update_own" on public.creatives
  for update
  to authenticated
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- DELETE: authenticated user can only delete their own rows
create policy "creatives_delete_own" on public.creatives
  for delete
  to authenticated
  using (auth.uid() = user_id);


-- ════════════════════════════════════════════════════════════════════════════
-- patterns
-- Patterns are shared / curated — all authenticated users can read them.
-- Only service-role (backend) can insert/update/delete.
-- ════════════════════════════════════════════════════════════════════════════
alter table public.patterns enable row level security;

drop policy if exists "patterns_select_authenticated" on public.patterns;
drop policy if exists "patterns_write_service_role"   on public.patterns;

-- SELECT: any authenticated user
create policy "patterns_select_authenticated" on public.patterns
  for select
  to authenticated
  using (true);

-- INSERT/UPDATE/DELETE: only service role (bypasses RLS by default; policy
-- below is a defensive belt-and-suspenders check for non-superuser service accounts)
create policy "patterns_write_service_role" on public.patterns
  for all
  to service_role
  using (true)
  with check (true);


-- ════════════════════════════════════════════════════════════════════════════
-- generation_requests
-- ════════════════════════════════════════════════════════════════════════════
alter table public.generation_requests enable row level security;

drop policy if exists "generation_requests_select_own" on public.generation_requests;
drop policy if exists "generation_requests_insert_own" on public.generation_requests;
drop policy if exists "generation_requests_update_own" on public.generation_requests;
drop policy if exists "generation_requests_delete_own" on public.generation_requests;

create policy "generation_requests_select_own" on public.generation_requests
  for select
  to authenticated
  using (auth.uid() = user_id);

create policy "generation_requests_insert_own" on public.generation_requests
  for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "generation_requests_update_own" on public.generation_requests
  for update
  to authenticated
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "generation_requests_delete_own" on public.generation_requests
  for delete
  to authenticated
  using (auth.uid() = user_id);
