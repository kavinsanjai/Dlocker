create extension if not exists "pgcrypto";

create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text not null unique,
  password_hash text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.documents (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.users (id) on delete cascade,
  file_name text not null,
  mime_type text not null,
  file_size integer not null,
  storage_path text not null unique,
  created_at timestamptz not null default now()
);

create index if not exists idx_documents_user_id_created_at
  on public.documents (user_id, created_at desc);

alter table public.documents
  add column if not exists ocr_text text,
  add column if not exists ocr_extracted_at timestamptz;

create extension if not exists pg_trgm;

create index if not exists idx_documents_file_name_trgm
  on public.documents using gin (file_name gin_trgm_ops);

create index if not exists idx_documents_ocr_text_trgm
  on public.documents using gin (ocr_text gin_trgm_ops);

create table if not exists public.document_shares (
  id bigint generated always as identity primary key,
  document_id bigint not null references public.documents (id) on delete cascade,
  user_id uuid not null references public.users (id) on delete cascade,
  share_token text not null unique,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  last_accessed_at timestamptz
);

create index if not exists idx_document_shares_token
  on public.document_shares (share_token);

create index if not exists idx_document_shares_user_created
  on public.document_shares (user_id, created_at desc);

create table if not exists public.activity_logs (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.users (id) on delete cascade,
  document_id bigint references public.documents (id) on delete set null,
  action text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  check (action in ('upload', 'download', 'delete', 'share', 'share_access'))
);

create index if not exists idx_activity_logs_user_created
  on public.activity_logs (user_id, created_at desc);
