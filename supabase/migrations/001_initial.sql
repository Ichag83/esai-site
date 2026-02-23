-- Creative Brain BR — initial schema
-- Run this in Supabase SQL editor or via `supabase db push`

-- ─────────────────────────────────────────────────────────────────────────────
-- creatives
-- Stores ingested ad URLs and their LLM-extracted creative DNA.
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists public.creatives (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid references auth.users(id) on delete cascade not null,
  source_platform     text not null,           -- 'meta' | 'tiktok' | 'instagram' | 'youtube' | 'other'
  source_url          text not null,
  product_category    text not null,
  marketplace_context text not null,           -- 'mercado_livre' | 'shopee' | 'tiktok_shop' | 'instagram' | 'none'
  status              text not null default 'PENDING', -- 'PENDING' | 'DONE' | 'FAILED'

  -- LLM-extracted fields (filled by /api/analyze)
  hook_text           text,
  hook_type           text,
  angle               text,
  structure           text,
  proof_type          text,
  objections          jsonb default '[]'::jsonb,
  cta_type            text,
  cta_text            text,
  editing_notes       jsonb,
  script_skeleton     text,

  -- Optional raw ad content passed by n8n or caller
  raw_snapshot        jsonb,

  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

-- RLS: users can only see their own creatives
alter table public.creatives enable row level security;

create policy "creatives_owner" on public.creatives
  for all using (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- patterns
-- Reusable creative patterns for /api/generate
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists public.patterns (
  id                  uuid primary key default gen_random_uuid(),
  platform            text not null,           -- 'tiktok' | 'meta' | 'instagram' | 'universal'
  product_category    text not null default 'geral',
  marketplace_context text not null default 'none',
  pattern_name        text not null,
  hook_formula        text,
  structure           text,
  script_skeleton     text,
  why_it_works        text,
  editing_notes       jsonb,
  tags                text[] default '{}',
  created_at          timestamptz not null default now()
);

-- Patterns are readable by all authenticated users
alter table public.patterns enable row level security;

create policy "patterns_read_all" on public.patterns
  for select using (auth.role() = 'authenticated');

-- ─────────────────────────────────────────────────────────────────────────────
-- generation_requests
-- Stores LLM generation jobs and their outputs.
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists public.generation_requests (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid references auth.users(id) on delete cascade not null,
  target_platform     text not null,
  marketplace_context text not null,
  product_category    text not null,
  product_name        text not null,
  product_description text,
  product_bullets     jsonb default '[]'::jsonb,
  price               text,
  offer_terms         jsonb default '{}'::jsonb,
  target_audience     text,
  constraints         jsonb default '{}'::jsonb,
  output_count        int not null default 5,
  output              jsonb,                   -- LLM response (variations array)
  status              text not null default 'PENDING', -- 'PENDING' | 'DONE' | 'FAILED'
  created_at          timestamptz not null default now()
);

alter table public.generation_requests enable row level security;

create policy "generation_requests_owner" on public.generation_requests
  for all using (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- Indexes
-- ─────────────────────────────────────────────────────────────────────────────
create index if not exists creatives_user_id_idx on public.creatives (user_id);
create index if not exists creatives_status_idx on public.creatives (status);
create index if not exists patterns_platform_idx on public.patterns (platform, product_category);
create index if not exists generation_requests_user_id_idx on public.generation_requests (user_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- updated_at trigger for creatives
-- ─────────────────────────────────────────────────────────────────────────────
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace trigger creatives_updated_at
  before update on public.creatives
  for each row execute function public.set_updated_at();
