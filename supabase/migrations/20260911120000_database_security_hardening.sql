-- AWHI database security hardening: least privilege, safer updates and indexes.

-- Future public objects are private by default; migrations must grant intentionally.
alter default privileges for role postgres in schema public
  revoke select, insert, update, delete, truncate, references, trigger on tables from anon, authenticated, service_role;
alter default privileges for role postgres in schema public
  revoke execute on functions from public, anon, authenticated, service_role;
alter default privileges for role postgres in schema public
  revoke usage, select, update on sequences from anon, authenticated, service_role;

-- The event-trigger function is internal DDL machinery, not an API endpoint.
revoke all on function public.rls_auto_enable() from public, anon, authenticated;

-- Narrow browser writes to the columns used by AWHI.
revoke update on table public.practitioners from authenticated;
grant update (display_name) on table public.practitioners to authenticated;

revoke update on table public.clients from authenticated;
grant update (status, consent_status, risk_level, alert_active, safety_plan, updated_at)
  on table public.clients to authenticated;

revoke insert, update on table public.case_notes from authenticated;
grant insert (client_id, practitioner_id, session_at, note_type, content, status, updated_at)
  on table public.case_notes to authenticated;
grant update (session_at, note_type, content, status, updated_at)
  on table public.case_notes to authenticated;

revoke insert, update on table public.appointments from authenticated;
grant insert (client_id, practitioner_id, scheduled_at, contact_type, status, purpose, updated_at)
  on table public.appointments to authenticated;
grant update (status, updated_at) on table public.appointments to authenticated;

revoke insert on table public.wellbeing_assessments from authenticated;
grant insert (client_id, practitioner_id, taha_tinana, taha_hinengaro, taha_whanau, taha_wairua, strengths, support_needs, risk_concerns, plan)
  on table public.wellbeing_assessments to authenticated;

-- Reassert assignment checks on every editable clinical row.
drop policy if exists "case_note_update_own_draft" on public.case_notes;
create policy "case_note_update_own_draft" on public.case_notes for update to authenticated
using (
  practitioner_id = (select auth.uid()) and status = 'draft' and exists (
    select 1 from public.practitioner_client_access a
    where a.client_id = case_notes.client_id
      and a.practitioner_id = (select auth.uid())
      and a.access_level in ('clinician','admin')
  )
)
with check (
  practitioner_id = (select auth.uid()) and exists (
    select 1 from public.practitioner_client_access a
    where a.client_id = case_notes.client_id
      and a.practitioner_id = (select auth.uid())
      and a.access_level in ('clinician','admin')
  )
);

drop policy if exists "appointment_update_own" on public.appointments;
create policy "appointment_update_own" on public.appointments for update to authenticated
using (
  practitioner_id = (select auth.uid()) and exists (
    select 1 from public.practitioner_client_access a
    where a.client_id = appointments.client_id
      and a.practitioner_id = (select auth.uid())
      and a.access_level in ('clinician','admin')
  )
)
with check (
  practitioner_id = (select auth.uid()) and exists (
    select 1 from public.practitioner_client_access a
    where a.client_id = appointments.client_id
      and a.practitioner_id = (select auth.uid())
      and a.access_level in ('clinician','admin')
  )
);

-- Index foreign keys and RLS lookup columns that were not covered previously.
create index if not exists clients_created_by_idx on public.clients (created_by);
create index if not exists case_notes_client_time_idx on public.case_notes (client_id, session_at desc);
create index if not exists case_notes_practitioner_idx on public.case_notes (practitioner_id);
