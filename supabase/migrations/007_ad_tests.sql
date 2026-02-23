-- ─────────────────────────────────────────────────────────────────────────────
-- 007_ad_tests.sql — Ad test results for feedback loop
-- ─────────────────────────────────────────────────────────────────────════════

create table if not exists public.ad_tests (
  id                    uuid primary key default gen_random_uuid(),
  generation_request_id uuid references public.generation_requests(id) on delete cascade,
  variation_index       int not null,
  platform              text not null,
  metric_snapshot       jsonb,
  winner                boolean default false,
  created_at            timestamptz not null default now()
);

create index if not exists ad_tests_generation_request_id_idx
  on public.ad_tests (generation_request_id);
