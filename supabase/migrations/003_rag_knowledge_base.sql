-- Fase 6: RAG knowledge base (incremental)
-- Safe to run multiple times

create extension if not exists vector;

alter table if exists public.conversation_state
  add column if not exists last_topic text;

create table if not exists public.knowledge_documents (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null,
  source_name text not null,
  source_type text not null,
  external_id text,
  content_hash text not null,
  version integer not null default 1,
  is_active boolean not null default true,
  metadata jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (org_id, source_name, version)
);

create index if not exists knowledge_documents_org_active_idx
  on public.knowledge_documents (org_id, is_active, created_at desc);

create index if not exists knowledge_documents_hash_idx
  on public.knowledge_documents (org_id, content_hash);

create or replace trigger knowledge_documents_updated_at
  before update on public.knowledge_documents
  for each row execute function public.set_updated_at_generic();

create table if not exists public.knowledge_chunks (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.knowledge_documents(id) on delete cascade,
  org_id uuid not null,
  chunk_index integer not null,
  content_text text not null,
  embedding vector(1536),
  metadata jsonb,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (document_id, chunk_index)
);

create index if not exists knowledge_chunks_org_doc_idx
  on public.knowledge_chunks (org_id, document_id, chunk_index);

create index if not exists knowledge_chunks_org_active_idx
  on public.knowledge_chunks (org_id, is_active, created_at desc);

create index if not exists knowledge_chunks_embedding_idx
  on public.knowledge_chunks using ivfflat (embedding vector_cosine_ops) with (lists = 100);
