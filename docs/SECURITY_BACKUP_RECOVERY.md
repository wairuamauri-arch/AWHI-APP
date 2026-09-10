# AWHI Security, Backup and Recovery Gate

## Current position
- Development and demo use only; no identifiable client information.
- RLS separation tested with two practitioner accounts.
- Audit events record actor, action, entity identifiers, status and time only. Note text and client names are excluded.

## Before real clinical use
1. Enable leaked-password protection and email confirmation in Supabase Auth.
2. Require MFA for project administrators and review whether practitioner MFA is required.
3. Obtain organisational privacy, clinical-governance and information-security approval.
4. Confirm the Supabase plan's backup retention. Free-plan backups cannot be downloaded; consider Pro and PITR for clinical recovery requirements.
5. Set a recovery-point objective (acceptable data loss) and recovery-time objective (acceptable outage).
6. Document who may restore data, approve a restore, and notify affected people.
7. Run and record a restore exercise using demo data before production approval.

## Recovery drill
1. Stop clinical entry and record the incident time.
2. Preserve audit evidence; do not delete or rewrite records.
3. Identify the last known-good point and obtain the designated approval.
4. Restore through the approved Supabase recovery method.
5. Verify authentication, practitioner separation, client access and note counts.
6. Record the outcome, any data gap and follow-up actions.

## Safety rule
Do not claim that AWHI is backed up merely because it is hosted. Backup availability, retention and restoration must be verified against the active Supabase plan and tested.
