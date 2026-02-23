-- ─────────────────────────────────────────────────────────────────────────────
-- 006_patterns_ranking.sql — Add ranking signals to patterns table
-- ─────────────────────────────────────────────────────────────────────────────

alter table public.patterns
  add column if not exists usage_count       int not null default 0,
  add column if not exists win_rate_estimate float not null default 0,
  add column if not exists updated_at        timestamptz not null default now();

-- Trigger to keep updated_at current on every update
drop trigger if exists patterns_set_updated_at on public.patterns;
create trigger patterns_set_updated_at
  before update on public.patterns
  for each row execute function public.set_updated_at();

-- Atomic helper: increment usage_count for a single pattern row
create or replace function public.increment_pattern_usage(pattern_id uuid)
returns void language sql as $$
  update public.patterns
  set    usage_count = usage_count + 1,
         updated_at  = now()
  where  id = pattern_id;
$$;
