-- AWHI Digital Clinic — Phase One starter schema
-- DEMO/DEVELOPMENT FOUNDATION. Review before production clinical use.

create extension if not exists pgcrypto;

create table if not exists public.practitioners (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  role text not null default 'practitioner',
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.clients (
  id uuid primary key default gen_random_uuid(),
  preferred_name text not null,
  family_name text,
  date_of_birth date,
  status text not null default 'active' check (status in ('active','inactive','archived')),
  created_by uuid not null references public.practitioners(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.practitioner_client_access (
  practitioner_id uuid not null references public.practitioners(id) on delete cascade,
  client_id uuid not null references public.clients(id) on delete cascade,
  access_level text not null default 'clinician' check (access_level in ('clinician','read_only','admin')),
  created_at timestamptz not null default now(),
  primary key (practitioner_id, client_id)
);

create table if not exists public.case_notes (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  practitioner_id uuid not null references public.practitioners(id),
  session_at timestamptz not null default now(),
  note_type text not null check (note_type in ('DARP','SOAP')),
  content jsonb not null default '{}'::jsonb,
  status text not null default 'draft' check (status in ('draft','final')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.practitioners enable row level security;
alter table public.clients enable row level security;
alter table public.practitioner_client_access enable row level security;
alter table public.case_notes enable row level security;

-- A practitioner can read/update their own practitioner profile.
create policy "practitioner_read_self"
on public.practitioners for select
to authenticated
using (id = auth.uid());

create policy "practitioner_update_self"
on public.practitioners for update
to authenticated
using (id = auth.uid())
with check (id = auth.uid());

-- Access-map rows are visible only to the practitioner named in the row.
create policy "access_read_own"
on public.practitioner_client_access for select
to authenticated
using (practitioner_id = auth.uid());

-- Client records are readable only when an access-map row exists.
create policy "client_read_assigned"
on public.clients for select
to authenticated
using (
  exists (
    select 1 from public.practitioner_client_access a
    where a.client_id = clients.id
      and a.practitioner_id = auth.uid()
  )
);

-- During Phase One, practitioners may create a client they own.
create policy "client_create_self"
on public.clients for insert
to authenticated
with check (created_by = auth.uid());

-- Assigned clinicians may update a client.
create policy "client_update_assigned"
on public.clients for update
to authenticated
using (
  exists (
    select 1 from public.practitioner_client_access a
    where a.client_id = clients.id
      and a.practitioner_id = auth.uid()
      and a.access_level in ('clinician','admin')
  )
)
with check (
  exists (
    select 1 from public.practitioner_client_access a
    where a.client_id = clients.id
      and a.practitioner_id = auth.uid()
      and a.access_level in ('clinician','admin')
  )
);

-- Notes require both practitioner ownership and client assignment.
create policy "case_note_read_assigned"
on public.case_notes for select
to authenticated
using (
  exists (
    select 1 from public.practitioner_client_access a
    where a.client_id = case_notes.client_id
      and a.practitioner_id = auth.uid()
  )
);

create policy "case_note_create_assigned"
on public.case_notes for insert
to authenticated
with check (
  practitioner_id = auth.uid()
  and exists (
    select 1 from public.practitioner_client_access a
    where a.client_id = case_notes.client_id
      and a.practitioner_id = auth.uid()
      and a.access_level in ('clinician','admin')
  )
);

create policy "case_note_update_own"
on public.case_notes for update
to authenticated
using (practitioner_id = auth.uid())
with check (practitioner_id = auth.uid());

-- IMPORTANT: Client creation and assignment should ultimately be handled by a
-- trusted server-side function/transaction so a newly-created client receives
-- its access row atomically. Do not expose service-role credentials in browser code.
