-- Cover the reverse side of the practitioner/client access foreign key.
create index if not exists practitioner_client_access_client_idx
  on public.practitioner_client_access (client_id);
