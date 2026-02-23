-- ─────────────────────────────────────────────────────────────────────────────
-- 005_ugc_pipeline.sql — UGC video blueprint + render job tables
-- ─────────────────────────────────────────────────────────────────────────────

-- ════════════════════════════════════════════════════════════════════════════
-- video_blueprints
-- Stores the structured UGC video blueprint produced by the LLM.
-- ════════════════════════════════════════════════════════════════════════════
create table if not exists public.video_blueprints (
  id                    uuid primary key default gen_random_uuid(),
  user_id               uuid,
  creative_id           uuid references public.creatives(id) on delete set null,
  generation_request_id uuid references public.generation_requests(id) on delete set null,
  input                 jsonb not null,
  blueprint             jsonb not null,
  status                text not null default 'DONE',  -- PENDING|RUNNING|DONE|FAILED (future use)
  created_at            timestamptz not null default now()
);

create index if not exists video_blueprints_user_id_idx
  on public.video_blueprints (user_id);

-- ════════════════════════════════════════════════════════════════════════════
-- video_jobs
-- Tracks individual render jobs submitted to external video providers.
-- ════════════════════════════════════════════════════════════════════════════
create table if not exists public.video_jobs (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid,
  blueprint_id     uuid not null references public.video_blueprints(id) on delete cascade,
  provider         text not null,           -- 'sora'|'veo'|'runway'|'kling'|'talking_actor'
  provider_payload jsonb not null,          -- final prompt pack / params per provider
  status           text not null default 'PENDING',  -- PENDING|RUNNING|DONE|FAILED
  attempts         int not null default 0,
  result_urls      jsonb,                   -- array of strings, nullable until done
  error            text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index if not exists video_jobs_status_created_at_idx
  on public.video_jobs (status, created_at);

-- ────────────────────────────────────────────────────────────────────────────
-- updated_at trigger for video_jobs
-- ────────────────────────────────────────────────────────────────────────────
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists video_jobs_set_updated_at on public.video_jobs;
create trigger video_jobs_set_updated_at
  before update on public.video_jobs
  for each row execute function public.set_updated_at();
