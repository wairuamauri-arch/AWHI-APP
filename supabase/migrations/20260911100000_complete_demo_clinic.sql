-- AWHI complete demo clinic: safety fields and Te Whare Tapa Wha assessments.
alter table public.clients add column if not exists consent_status text not null default 'not_recorded';
alter table public.clients add column if not exists risk_level text not null default 'not_assessed';
alter table public.clients add column if not exists alert_active boolean not null default false;
alter table public.clients add column if not exists safety_plan text;

do $$ begin
  alter table public.clients add constraint clients_consent_status_check check (consent_status in ('not_recorded','verbal','written','declined'));
exception when duplicate_object then null; end $$;
do $$ begin
  alter table public.clients add constraint clients_risk_level_check check (risk_level in ('not_assessed','low','moderate','high','immediate'));
exception when duplicate_object then null; end $$;

create table if not exists public.wellbeing_assessments (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  practitioner_id uuid not null references public.practitioners(id),
  assessed_at timestamptz not null default now(),
  taha_tinana smallint not null check (taha_tinana between 1 and 5),
  taha_hinengaro smallint not null check (taha_hinengaro between 1 and 5),
  taha_whanau smallint not null check (taha_whanau between 1 and 5),
  taha_wairua smallint not null check (taha_wairua between 1 and 5),
  strengths text,
  support_needs text,
  risk_concerns text,
  plan text,
  created_at timestamptz not null default now()
);
alter table public.wellbeing_assessments enable row level security;
create index if not exists wellbeing_client_time_idx on public.wellbeing_assessments (client_id, assessed_at desc);
create index if not exists wellbeing_practitioner_time_idx on public.wellbeing_assessments (practitioner_id, assessed_at desc);

drop policy if exists "wellbeing_read_assigned" on public.wellbeing_assessments;
create policy "wellbeing_read_assigned" on public.wellbeing_assessments for select to authenticated using (
  practitioner_id = (select auth.uid()) and exists (select 1 from public.practitioner_client_access a where a.client_id=wellbeing_assessments.client_id and a.practitioner_id=(select auth.uid()))
);
drop policy if exists "wellbeing_create_assigned" on public.wellbeing_assessments;
create policy "wellbeing_create_assigned" on public.wellbeing_assessments for insert to authenticated with check (
  practitioner_id = (select auth.uid()) and exists (select 1 from public.practitioner_client_access a where a.client_id=wellbeing_assessments.client_id and a.practitioner_id=(select auth.uid()) and a.access_level in ('clinician','admin'))
);
revoke all on table public.wellbeing_assessments from public, anon, authenticated;
grant select, insert on table public.wellbeing_assessments to authenticated;

alter table public.audit_events drop constraint if exists audit_events_action_check;
alter table public.audit_events add constraint audit_events_action_check check (action in (
  'client.created','client.updated','note.created','note.updated','note.finalized','appointment.created','appointment.updated','appointment.completed','wellbeing.created'
));
alter table public.audit_events drop constraint if exists audit_events_entity_type_check;
alter table public.audit_events add constraint audit_events_entity_type_check check (entity_type in ('client','case_note','appointment','wellbeing_assessment'));

create or replace function private.audit_wellbeing_assessment()
returns trigger language plpgsql security definer set search_path='' as $$
begin
  if coalesce(auth.uid(),new.practitioner_id) is null then raise exception 'Audit actor required'; end if;
  insert into public.audit_events(actor_id,action,entity_type,entity_id,client_id,metadata)
  values(coalesce(auth.uid(),new.practitioner_id),'wellbeing.created','wellbeing_assessment',new.id,new.client_id,jsonb_build_object('mauri_score',new.taha_tinana+new.taha_hinengaro+new.taha_whanau+new.taha_wairua));
  return new;
end; $$;
revoke all on function private.audit_wellbeing_assessment() from public, anon, authenticated;
drop trigger if exists audit_wellbeing_created on public.wellbeing_assessments;
create trigger audit_wellbeing_created after insert on public.wellbeing_assessments for each row execute function private.audit_wellbeing_assessment();
