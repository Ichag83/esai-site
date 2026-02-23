-- Fase 7: QA/guardrails, approved responses, scoring and optional campaign support
-- Idempotent migration

alter table if exists public.conversation_state
  add column if not exists lead_score integer,
  add column if not exists priority_level text;

alter table if exists public.conversation_state
  alter column lead_temperature type text;

create index if not exists conversation_state_lead_score_idx
  on public.conversation_state (lead_score desc nulls last);

create index if not exists conversation_state_priority_idx
  on public.conversation_state (priority_level);

create table if not exists public.approved_responses (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null,
  channel_id uuid,
  intent_key text not null,
  variant text not null default 'default',
  message_template text not null,
  is_active boolean not null default true,
  metadata jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists approved_responses_unique_idx
  on public.approved_responses (org_id, coalesce(channel_id, '00000000-0000-0000-0000-000000000000'::uuid), intent_key, variant);

create index if not exists approved_responses_lookup_idx
  on public.approved_responses (org_id, intent_key, is_active);

create or replace trigger approved_responses_updated_at
  before update on public.approved_responses
  for each row execute function public.set_updated_at_generic();

create table if not exists public.suppression_list (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null,
  contact_id uuid,
  phone text not null,
  reason text,
  source text default 'manual',
  is_active boolean not null default true,
  metadata jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (org_id, phone)
);

create index if not exists suppression_list_active_idx
  on public.suppression_list (org_id, is_active, created_at desc);

create or replace trigger suppression_list_updated_at
  before update on public.suppression_list
  for each row execute function public.set_updated_at_generic();

create table if not exists public.campaign_runs (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null,
  name text not null,
  status text not null default 'draft' check (status in ('draft', 'running', 'paused', 'completed', 'failed')),
  audience_filter jsonb,
  message_template text,
  sent_count integer not null default 0,
  failed_count integer not null default 0,
  blocked_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.campaign_messages (
  id uuid primary key default gen_random_uuid(),
  campaign_run_id uuid references public.campaign_runs(id) on delete cascade,
  org_id uuid not null,
  phone text not null,
  status text not null default 'queued' check (status in ('queued', 'sent', 'failed', 'blocked')),
  block_reason text,
  message_id text,
  created_at timestamptz not null default now()
);

create index if not exists campaign_messages_run_status_idx
  on public.campaign_messages (campaign_run_id, status, created_at desc);
