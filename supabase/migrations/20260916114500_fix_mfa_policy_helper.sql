create schema if not exists private;
revoke all on schema private from public, anon;
grant usage on schema private to authenticated;

create or replace function private.mfa_access_allowed()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select case
    when (select auth.uid()) is null then false
    when exists (
      select 1
      from auth.mfa_factors
      where user_id = (select auth.uid())
        and status = 'verified'
    )
      then coalesce((select auth.jwt()->>'aal') = 'aal2', false)
    else true
  end;
$$;

revoke execute on function private.mfa_access_allowed() from public, anon, service_role;
grant execute on function private.mfa_access_allowed() to authenticated;

drop policy if exists "Require MFA when enrolled" on public.practitioners;
create policy "Require MFA when enrolled"
on public.practitioners
as restrictive
for all
to authenticated
using ((select private.mfa_access_allowed()))
with check ((select private.mfa_access_allowed()));

drop policy if exists "Require MFA when enrolled" on public.clients;
create policy "Require MFA when enrolled"
on public.clients
as restrictive
for all
to authenticated
using ((select private.mfa_access_allowed()))
with check ((select private.mfa_access_allowed()));

drop policy if exists "Require MFA when enrolled" on public.practitioner_client_access;
create policy "Require MFA when enrolled"
on public.practitioner_client_access
as restrictive
for all
to authenticated
using ((select private.mfa_access_allowed()))
with check ((select private.mfa_access_allowed()));

drop policy if exists "Require MFA when enrolled" on public.case_notes;
create policy "Require MFA when enrolled"
on public.case_notes
as restrictive
for all
to authenticated
using ((select private.mfa_access_allowed()))
with check ((select private.mfa_access_allowed()));

drop policy if exists "Require MFA when enrolled" on public.appointments;
create policy "Require MFA when enrolled"
on public.appointments
as restrictive
for all
to authenticated
using ((select private.mfa_access_allowed()))
with check ((select private.mfa_access_allowed()));

drop policy if exists "Require MFA when enrolled" on public.wellbeing_assessments;
create policy "Require MFA when enrolled"
on public.wellbeing_assessments
as restrictive
for all
to authenticated
using ((select private.mfa_access_allowed()))
with check ((select private.mfa_access_allowed()));

drop policy if exists "Require MFA when enrolled" on public.audit_events;
create policy "Require MFA when enrolled"
on public.audit_events
as restrictive
for all
to authenticated
using ((select private.mfa_access_allowed()))
with check ((select private.mfa_access_allowed()));


