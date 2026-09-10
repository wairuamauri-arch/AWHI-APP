-- AWHI Phase One: practitioner bootstrap and secure demo-client creation.

create schema if not exists private;
revoke all on schema private from public, anon;
grant usage on schema private to authenticated;

create or replace function private.handle_new_awhi_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.practitioners (id, display_name, role, active)
  values (
    new.id,
    coalesce(
      nullif(btrim(new.raw_user_meta_data ->> 'display_name'), ''),
      nullif(btrim(new.raw_user_meta_data ->> 'full_name'), ''),
      nullif(split_part(coalesce(new.email, ''), '@', 1), ''),
      'Practitioner'
    ),
    'practitioner',
    true
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

revoke all on function private.handle_new_awhi_user() from public, anon, authenticated;

drop trigger if exists on_auth_user_created_awhi on auth.users;
create trigger on_auth_user_created_awhi
after insert on auth.users
for each row execute function private.handle_new_awhi_user();

insert into public.practitioners (id, display_name, role, active)
select
  u.id,
  coalesce(
    nullif(btrim(u.raw_user_meta_data ->> 'display_name'), ''),
    nullif(btrim(u.raw_user_meta_data ->> 'full_name'), ''),
    nullif(split_part(coalesce(u.email, ''), '@', 1), ''),
    'Practitioner'
  ),
  'practitioner',
  true
from auth.users u
on conflict (id) do nothing;

create or replace function private.create_demo_client_internal(
  p_preferred_name text,
  p_family_name text default null,
  p_date_of_birth date default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_client_id uuid;
  v_preferred_name text := btrim(coalesce(p_preferred_name, ''));
  v_family_name text := nullif(btrim(coalesce(p_family_name, '')), '');
begin
  if v_user_id is null then raise exception 'Authentication required'; end if;
  if not exists (select 1 from public.practitioners where id = v_user_id and active = true) then
    raise exception 'Active practitioner profile required';
  end if;
  if char_length(v_preferred_name) < 1 or char_length(v_preferred_name) > 100 then
    raise exception 'Preferred name must contain between 1 and 100 characters';
  end if;
  if v_family_name is not null and char_length(v_family_name) > 100 then
    raise exception 'Family name must contain 100 characters or fewer';
  end if;
  if p_date_of_birth is not null and p_date_of_birth > current_date then
    raise exception 'Date of birth cannot be in the future';
  end if;

  insert into public.clients (preferred_name, family_name, date_of_birth, status, created_by)
  values (v_preferred_name, v_family_name, p_date_of_birth, 'active', v_user_id)
  returning id into v_client_id;

  insert into public.practitioner_client_access (practitioner_id, client_id, access_level)
  values (v_user_id, v_client_id, 'clinician');

  return v_client_id;
end;
$$;

revoke all on function private.create_demo_client_internal(text, text, date) from public, anon;
grant execute on function private.create_demo_client_internal(text, text, date) to authenticated;

create or replace function public.create_demo_client(
  p_preferred_name text,
  p_family_name text default null,
  p_date_of_birth date default null
)
returns uuid
language sql
security invoker
set search_path = ''
as $$
  select private.create_demo_client_internal(p_preferred_name, p_family_name, p_date_of_birth);
$$;

revoke all on function public.create_demo_client(text, text, date) from public, anon;
grant execute on function public.create_demo_client(text, text, date) to authenticated;

revoke all on table public.practitioners, public.clients, public.practitioner_client_access, public.case_notes from anon;
revoke all on table public.practitioners, public.clients, public.practitioner_client_access, public.case_notes from authenticated;
grant select, update on table public.practitioners to authenticated;
grant select, update on table public.clients to authenticated;
grant select on table public.practitioner_client_access to authenticated;
grant select, insert, update on table public.case_notes to authenticated;
