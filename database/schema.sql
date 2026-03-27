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
