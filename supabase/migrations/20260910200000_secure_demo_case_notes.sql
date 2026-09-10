-- AWHI Phase One: constrain demo clinical notes and prevent cross-client updates.

alter table public.case_notes
  drop constraint if exists case_notes_content_shape;

alter table public.case_notes
  add constraint case_notes_content_shape check (
    jsonb_typeof(content) = 'object'
    and octet_length(content::text) <= 50000
    and (
      (note_type = 'DARP' and content ?& array['data', 'assessment', 'response', 'plan'])
      or
      (note_type = 'SOAP' and content ?& array['subjective', 'objective', 'assessment', 'plan'])
    )
  );

drop policy if exists "case_note_update_own" on public.case_notes;
drop policy if exists "case_note_update_own_draft" on public.case_notes;

create policy "case_note_update_own_draft"
on public.case_notes for update
to authenticated
using (
  practitioner_id = (select auth.uid())
  and status = 'draft'
  and exists (
    select 1 from public.practitioner_client_access a
    where a.client_id = case_notes.client_id
      and a.practitioner_id = (select auth.uid())
      and a.access_level in ('clinician', 'admin')
  )
)
with check (
  practitioner_id = (select auth.uid())
  and exists (
    select 1 from public.practitioner_client_access a
    where a.client_id = case_notes.client_id
      and a.practitioner_id = (select auth.uid())
      and a.access_level in ('clinician', 'admin')
  )
);

revoke all on table public.case_notes from anon;
revoke all on table public.case_notes from authenticated;
grant select, insert, update on table public.case_notes to authenticated;
