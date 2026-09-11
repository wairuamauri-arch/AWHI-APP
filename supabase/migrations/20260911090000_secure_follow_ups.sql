-- AWHI next phase: secure practitioner appointments and follow-ups.
create table if not exists public.appointments (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  practitioner_id uuid not null references public.practitioners(id),
  scheduled_at timestamptz not null,
  contact_type text not null check (contact_type in ('in_person','phone','video','home_visit','other')),
  status text not null default 'scheduled' check (status in ('scheduled','completed','cancelled','no_show')),
  purpose text not null default 'Follow-up' check (char_length(purpose) between 1 and 160),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.appointments enable row level security;
create index if not exists appointments_practitioner_time_idx on public.appointments (practitioner_id, scheduled_at);
create index if not exists appointments_client_time_idx on public.appointments (client_id, scheduled_at desc);

drop policy if exists "appointment_read_own" on public.appointments;
create policy "appointment_read_own" on public.appointments for select to authenticated
using ((select auth.uid()) = practitioner_id and exists (
  select 1 from public.practitioner_client_access a
  where a.client_id = appointments.client_id and a.practitioner_id = (select auth.uid())
));
drop policy if exists "appointment_create_own" on public.appointments;
create policy "appointment_create_own" on public.appointments for insert to authenticated
with check ((select auth.uid()) = practitioner_id and exists (
  select 1 from public.practitioner_client_access a
  where a.client_id = appointments.client_id and a.practitioner_id = (select auth.uid())
    and a.access_level in ('clinician','admin')
));
drop policy if exists "appointment_update_own" on public.appointments;
create policy "appointment_update_own" on public.appointments for update to authenticated
using ((select auth.uid()) = practitioner_id)
with check ((select auth.uid()) = practitioner_id and exists (
  select 1 from public.practitioner_client_access a
  where a.client_id = appointments.client_id and a.practitioner_id = (select auth.uid())
    and a.access_level in ('clinician','admin')
));

revoke all on table public.appointments from public, anon, authenticated;
grant select, insert, update on table public.appointments to authenticated;

alter table public.audit_events drop constraint if exists audit_events_action_check;
alter table public.audit_events add constraint audit_events_action_check check (action in (
  'client.created','client.updated','note.created','note.updated','note.finalized',
  'appointment.created','appointment.updated','appointment.completed'
));
alter table public.audit_events drop constraint if exists audit_events_entity_type_check;
alter table public.audit_events add constraint audit_events_entity_type_check check (entity_type in ('client','case_note','appointment'));

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
  elsif tg_table_name = 'appointments' then
    v_actor_id := coalesce(auth.uid(), new.practitioner_id); v_entity_type := 'appointment'; v_entity_id := new.id; v_client_id := new.client_id;
    v_action := case when tg_op = 'INSERT' then 'appointment.created' when old.status <> 'completed' and new.status = 'completed' then 'appointment.completed' else 'appointment.updated' end;
    v_metadata := jsonb_build_object('contact_type', new.contact_type, 'status', new.status);
  else raise exception 'Unsupported audit source'; end if;
  if v_actor_id is null then raise exception 'Audit actor required'; end if;
  insert into public.audit_events (actor_id, action, entity_type, entity_id, client_id, metadata)
  values (v_actor_id, v_action, v_entity_type, v_entity_id, v_client_id, v_metadata);
  return new;
end; $$;
revoke all on function private.record_awhi_audit_event() from public, anon, authenticated;
drop trigger if exists audit_appointments_changes on public.appointments;
create trigger audit_appointments_changes after insert or update on public.appointments
for each row execute function private.record_awhi_audit_event();
