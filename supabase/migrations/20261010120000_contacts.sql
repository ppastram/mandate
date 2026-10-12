-- Mandate: policymaker contact form. Writes go through submit_contact();
-- no anon/authenticated reads of the raw table.

-- ─── Table: contacts ─────────────────────────────────────────────────
create table if not exists public.contacts (
  id            uuid        primary key default gen_random_uuid(),
  name          text        not null check (length(trim(name))        between 1 and 200),
  institution   text        not null check (length(trim(institution)) between 1 and 200),
  email         text        not null check (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  country_iso3  text                 check (country_iso3 ~ '^[A-Z]{3}$'),
  created_at    timestamptz not null default now()
);

create index if not exists contacts_country_idx on public.contacts(country_iso3);
create index if not exists contacts_created_idx on public.contacts(created_at desc);

-- ─── RLS: no public read ─────────────────────────────────────────────
alter table public.contacts enable row level security;
revoke all on table public.contacts from anon, authenticated;

-- ─── Function: submit_contact ────────────────────────────────────────
create or replace function public.submit_contact(
  p_name         text,
  p_institution  text,
  p_email        text,
  p_country_iso3 text
) returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  new_id uuid;
begin
  if p_name is null or length(trim(p_name)) = 0 then
    raise exception 'name is required';
  end if;
  if p_institution is null or length(trim(p_institution)) = 0 then
    raise exception 'institution is required';
  end if;
  if p_email is null or p_email !~* '^[^@\s]+@[^@\s]+\.[^@\s]+$' then
    raise exception 'valid email is required';
  end if;
  if p_country_iso3 is not null
     and length(p_country_iso3) > 0
     and p_country_iso3 !~ '^[A-Z]{3}$' then
    raise exception 'country_iso3 must be 3 uppercase letters';
  end if;

  insert into public.contacts (name, institution, email, country_iso3)
  values (
    trim(p_name),
    trim(p_institution),
    lower(trim(p_email)),
    nullif(trim(p_country_iso3), '')
  )
  returning id into new_id;

  return new_id;
end;
$$;

revoke all on function public.submit_contact(text, text, text, text) from public;
grant execute on function public.submit_contact(text, text, text, text) to anon, authenticated;
