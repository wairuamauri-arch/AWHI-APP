-- Require AAL2 for practitioners who have enrolled a verified MFA factor.
-- Accounts without an enrolled factor retain AAL1 access during rollout.

create policy "Require MFA when enrolled"
on public.practitioners
as restrictive
for all
to authenticated
using (
  array[(select auth.jwt()->>'aal')] <@ (
    select case
      when count(id) > 0 then array['aal2']
      else array['aal1', 'aal2']
    end
    from auth.mfa_factors
    where (select auth.uid()) = user_id
      and status = 'verified'
  )
)
with check (
  array[(select auth.jwt()->>'aal')] <@ (
    select case
      when count(id) > 0 then array['aal2']
      else array['aal1', 'aal2']
    end
    from auth.mfa_factors
    where (select auth.uid()) = user_id
      and status = 'verified'
  )
);

create policy "Require MFA when enrolled"
on public.clients
as restrictive
for all
to authenticated
using (
  array[(select auth.jwt()->>'aal')] <@ (
    select case
      when count(id) > 0 then array['aal2']
      else array['aal1', 'aal2']
    end
    from auth.mfa_factors
    where (select auth.uid()) = user_id
      and status = 'verified'
  )
)
with check (
  array[(select auth.jwt()->>'aal')] <@ (
    select case
      when count(id) > 0 then array['aal2']
      else array['aal1', 'aal2']
    end
    from auth.mfa_factors
    where (select auth.uid()) = user_id
      and status = 'verified'
  )
);

create policy "Require MFA when enrolled"
on public.practitioner_client_access
as restrictive
for all
to authenticated
using (
  array[(select auth.jwt()->>'aal')] <@ (
    select case
      when count(id) > 0 then array['aal2']
      else array['aal1', 'aal2']
    end
    from auth.mfa_factors
    where (select auth.uid()) = user_id
      and status = 'verified'
  )
)
with check (
  array[(select auth.jwt()->>'aal')] <@ (
    select case
      when count(id) > 0 then array['aal2']
      else array['aal1', 'aal2']
    end
    from auth.mfa_factors
    where (select auth.uid()) = user_id
      and status = 'verified'
  )
);

create policy "Require MFA when enrolled"
on public.case_notes
as restrictive
for all
to authenticated
using (
  array[(select auth.jwt()->>'aal')] <@ (
    select case
      when count(id) > 0 then array['aal2']
      else array['aal1', 'aal2']
    end
    from auth.mfa_factors
    where (select auth.uid()) = user_id
      and status = 'verified'
  )
)
with check (
  array[(select auth.jwt()->>'aal')] <@ (
    select case
      when count(id) > 0 then array['aal2']
      else array['aal1', 'aal2']
    end
    from auth.mfa_factors
    where (select auth.uid()) = user_id
      and status = 'verified'
  )
);

create policy "Require MFA when enrolled"
on public.appointments
as restrictive
for all
to authenticated
using (
  array[(select auth.jwt()->>'aal')] <@ (
    select case
      when count(id) > 0 then array['aal2']
      else array['aal1', 'aal2']
    end
    from auth.mfa_factors
    where (select auth.uid()) = user_id
      and status = 'verified'
  )
)
with check (
  array[(select auth.jwt()->>'aal')] <@ (
    select case
      when count(id) > 0 then array['aal2']
      else array['aal1', 'aal2']
    end
    from auth.mfa_factors
    where (select auth.uid()) = user_id
      and status = 'verified'
  )
);

create policy "Require MFA when enrolled"
on public.wellbeing_assessments
as restrictive
for all
to authenticated
using (
  array[(select auth.jwt()->>'aal')] <@ (
    select case
      when count(id) > 0 then array['aal2']
      else array['aal1', 'aal2']
    end
    from auth.mfa_factors
    where (select auth.uid()) = user_id
      and status = 'verified'
  )
)
with check (
  array[(select auth.jwt()->>'aal')] <@ (
    select case
      when count(id) > 0 then array['aal2']
      else array['aal1', 'aal2']
    end
    from auth.mfa_factors
    where (select auth.uid()) = user_id
      and status = 'verified'
  )
);

create policy "Require MFA when enrolled"
on public.audit_events
as restrictive
for all
to authenticated
using (
  array[(select auth.jwt()->>'aal')] <@ (
    select case
      when count(id) > 0 then array['aal2']
      else array['aal1', 'aal2']
    end
    from auth.mfa_factors
    where (select auth.uid()) = user_id
      and status = 'verified'
  )
)
with check (
  array[(select auth.jwt()->>'aal')] <@ (
    select case
      when count(id) > 0 then array['aal2']
      else array['aal1', 'aal2']
    end
    from auth.mfa_factors
    where (select auth.uid()) = user_id
      and status = 'verified'
  )
);


