-- WhatsApp automation schema (Fase 1+ foundation)
-- Safe to run multiple times

-- Optional helper for updated_at triggers
create or replace function public.set_updated_at_generic()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- messages
-- Stores inbound/outbound messages for idempotency, history and troubleshooting.
-- ---------------------------------------------------------------------------
create table if not exists public.messages (
  id                  uuid primary key default gen_random_uuid(),
  org_id              uuid not null,
  channel_id          uuid not null,
  contact_id          uuid,
  direction           text not null check (direction in ('inbound', 'outbound')),
  message_id          text not null,
  provider            text not null default 'whatsapp',
  provider_message_id text,
  remote_jid          text,
  phone               text,
  message_type        text,
  content_text        text,
  media_url           text,
  raw_payload         jsonb,
  trace_id            text,
  status              text not null default 'received'
                        check (status in ('received', 'processed', 'sent', 'failed', 'duplicated')),
  error_code          text,
  error_detail        text,
  created_at          timestamptz not null default now()
);

-- Idempotency key for inbound/outbound by provider message id context
create unique index if not exists messages_dedup_unique_idx
  on public.messages (org_id, channel_id, direction, message_id);

create index if not exists messages_org_channel_created_idx
  on public.messages (org_id, channel_id, created_at desc);

create index if not exists messages_phone_created_idx
  on public.messages (phone, created_at desc);

create index if not exists messages_trace_id_idx
  on public.messages (trace_id);

create index if not exists messages_status_idx
  on public.messages (status);

-- ---------------------------------------------------------------------------
-- conversation_state
-- Persistent state per conversation thread/contact.
-- ---------------------------------------------------------------------------
create table if not exists public.conversation_state (
  id                  uuid primary key default gen_random_uuid(),
  org_id              uuid not null,
  channel_id          uuid not null,
  contact_id          uuid,
  phone               text not null,
  state               text not null default 'new'
                        check (state in ('new', 'qualifying', 'qualified', 'handoff', 'closed')),
  ai_paused           boolean not null default false,
  handoff_status      text not null default 'none'
                        check (handoff_status in ('none', 'open', 'closed')),
  handoff_reason      text,
  last_inbound_at     timestamptz,
  last_outbound_at    timestamptz,
  last_intent         text,
  lead_temperature    text,
  owner_user_id       uuid,
  followup_stage      integer not null default 0,
  next_followup_at    timestamptz,
  opt_out             boolean not null default false,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create unique index if not exists conversation_state_unique_thread_idx
  on public.conversation_state (org_id, channel_id, phone);

create index if not exists conversation_state_handoff_idx
  on public.conversation_state (handoff_status);

create index if not exists conversation_state_ai_paused_idx
  on public.conversation_state (ai_paused);

create index if not exists conversation_state_next_followup_idx
  on public.conversation_state (next_followup_at)
  where next_followup_at is not null;

create or replace trigger conversation_state_updated_at
  before update on public.conversation_state
  for each row
  execute function public.set_updated_at_generic();

-- ---------------------------------------------------------------------------
-- workflow_events
-- Structured events for observability, retries and debugging.
-- ---------------------------------------------------------------------------
create table if not exists public.workflow_events (
  id                  uuid primary key default gen_random_uuid(),
  trace_id            text,
  workflow_id         text,
  execution_id        text,
  node_name           text,
  level               text not null default 'info'
                        check (level in ('debug', 'info', 'warn', 'error')),
  event               text not null,
  payload             jsonb,
  created_at          timestamptz not null default now()
);

create index if not exists workflow_events_trace_id_idx
  on public.workflow_events (trace_id);

create index if not exists workflow_events_workflow_exec_idx
  on public.workflow_events (workflow_id, execution_id, created_at desc);

create index if not exists workflow_events_level_created_idx
  on public.workflow_events (level, created_at desc);

-- Optional: enable RLS if desired by your governance model
-- alter table public.messages enable row level security;
-- alter table public.conversation_state enable row level security;
-- alter table public.workflow_events enable row level security;
