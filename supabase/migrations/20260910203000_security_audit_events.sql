-- AWHI security phase: content-free, practitioner-visible audit events.
create table if not exists public.audit_events (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.practitioners(id),
  action text not null check (action in ('client.created','client.updated','note.created','note.updated','note.finalized')),
  entity_type text not null check (entity_type in ('client','case_note')),
  entity_id uuid not null,
  client_id uuid references public.clients(id) on delete set null,
  metadata jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default now()
);
alter table public.audit_events enable row level security;
create index if not exists audit_events_actor_time_idx on public.audit_events (actor_id, occurred_at desc);
create index if not exists audit_events_client_time_idx on public.audit_events (client_id, occurred_at desc);
drop policy if exists "audit_read_own" on public.audit_events;
create policy "audit_read_own" on public.audit_events for select to authenticated using (actor_id = (select auth.uid()));
revoke all on table public.audit_events from public, anon, authenticated;
grant select on table public.audit_events to authenticated;

create or replace function private.record_awhi_audit_event()
returns trigger language plpgsql security definer set search_path = '' as $$
declare v_actor_id uuid; v_action text; v_entity_type text; v_entity_id uuid; v_client_id uuid; v_metadata jsonb := '{}'::jsonb;
begin
  if tg_table_name = 'clients' then
    v_actor_id := coalesce(auth.uid(), new.created_by); v_entity_type := 'client'; v_entity_id := new.id; v_client_id := new.id;
    v_action := case when tg_op = 'INSERT' then 'client.created' else 'client.updated' end;
    v_metadata := jsonb_build_object('status', new.status);
  elsif tg_table_name = 'case_notes' then
    v_actor_id := coalesce(auth.uid(), new.practitioner_id); v_entity_type := 'case_note'; v_entity_id := new.id; v_client_id := new.client_id;
    v_action := case when tg_op = 'INSERT' then 'note.created' when old.status = 'draft' and new.status = 'final' then 'note.finalized' else 'note.updated' end;
    v_metadata := jsonb_build_object('note_type', new.note_type, 'status', new.status);
  else raise exception 'Unsupported audit source'; end if;
  if v_actor_id is null then raise exception 'Audit actor required'; end if;
  insert into public.audit_events (actor_id, action, entity_type, entity_id, client_id, metadata)
  values (v_actor_id, v_action, v_entity_type, v_entity_id, v_client_id, v_metadata);
  return new;
end; $$;
revoke all on function private.record_awhi_audit_event() from public, anon, authenticated;
drop trigger if exists audit_clients_changes on public.clients;
create trigger audit_clients_changes after insert or update on public.clients for each row execute function private.record_awhi_audit_event();
drop trigger if exists audit_case_notes_changes on public.case_notes;
create trigger audit_case_notes_changes after insert or update on public.case_notes for each row execute function private.record_awhi_audit_event();
