-- Mandate: core response storage with security-definer RPCs.
-- Idempotent where safe. Apply once per environment.

-- ─── Extensions ──────────────────────────────────────────────────────
create extension if not exists pgcrypto;  -- gen_random_uuid()

-- ─── Table: responses ────────────────────────────────────────────────
create table if not exists public.responses (
  id            uuid        primary key default gen_random_uuid(),
  device_id     uuid        not null unique,
  country_iso3  text        not null check (country_iso3 ~ '^[A-Z]{3}$'),
  region        text,
  a1            smallint    not null check (a1 in (0, 25, 50, 75, 100)),
  a2            smallint    not null check (a2 in (0, 25, 50, 75, 100)),
  a3            smallint    not null check (a3 in (0, 25, 50, 75, 100)),
  a4            smallint    not null check (a4 in (0, 25, 50, 75, 100)),
  a5            smallint    not null check (a5 in (0, 25, 50, 75, 100)),
  a6            smallint    not null check (a6 in (0, 25, 50, 75, 100)),
  lang          text        not null check (lang in ('es', 'en')),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists responses_country_iso3_idx on public.responses(country_iso3);

-- ─── Row Level Security ──────────────────────────────────────────────
alter table public.responses enable row level security;

-- No policies defined => no anon/authenticated role can select, insert,
-- update, or delete the table directly. All writes go through
-- submit_response(). All reads go through country_results().

-- Belt-and-braces: revoke table privileges explicitly.
revoke all on table public.responses from anon, authenticated;

-- ─── Function: submit_response ───────────────────────────────────────
-- Validates values and upserts by device_id. Returns the stored row.
create or replace function public.submit_response(
  p_device_id    uuid,
  p_country_iso3 text,
  p_region       text,
  p_a1           smallint,
  p_a2           smallint,
  p_a3           smallint,
  p_a4           smallint,
  p_a5           smallint,
  p_a6           smallint,
  p_lang         text
) returns public.responses
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  r public.responses;
begin
  if p_device_id is null then
    raise exception 'device_id is required';
  end if;
  if p_country_iso3 is null or p_country_iso3 !~ '^[A-Z]{3}$' then
    raise exception 'country_iso3 must be 3 uppercase letters';
  end if;
  if p_lang is null or p_lang not in ('es', 'en') then
    raise exception 'lang must be es or en';
  end if;
  if not (
    p_a1 in (0, 25, 50, 75, 100) and
    p_a2 in (0, 25, 50, 75, 100) and
    p_a3 in (0, 25, 50, 75, 100) and
    p_a4 in (0, 25, 50, 75, 100) and
    p_a5 in (0, 25, 50, 75, 100) and
    p_a6 in (0, 25, 50, 75, 100)
  ) then
    raise exception 'answers must each be one of 0, 25, 50, 75, 100';
  end if;

  insert into public.responses
    (device_id, country_iso3, region, a1, a2, a3, a4, a5, a6, lang)
  values
    (p_device_id, p_country_iso3, nullif(trim(p_region), ''),
     p_a1, p_a2, p_a3, p_a4, p_a5, p_a6, p_lang)
  on conflict (device_id) do update
    set country_iso3 = excluded.country_iso3,
        region       = excluded.region,
        a1           = excluded.a1,
        a2           = excluded.a2,
        a3           = excluded.a3,
        a4           = excluded.a4,
        a5           = excluded.a5,
        a6           = excluded.a6,
        lang         = excluded.lang,
        updated_at   = now()
  returning * into r;

  return r;
end;
$$;

revoke all on function public.submit_response(
  uuid, text, text, smallint, smallint, smallint, smallint, smallint, smallint, text
) from public;
grant execute on function public.submit_response(
  uuid, text, text, smallint, smallint, smallint, smallint, smallint, smallint, text
) to anon, authenticated;

-- ─── Function: country_results ───────────────────────────────────────
-- Per country: response count, plus per-statement and per-axis averages
-- that are only emitted when at least 30 responses exist (k-anonymity).
create or replace function public.country_results()
returns table (
  country_iso3 text,
  n            integer,
  a1_avg       numeric,
  a2_avg       numeric,
  a3_avg       numeric,
  a4_avg       numeric,
  a5_avg       numeric,
  a6_avg       numeric,
  reg_avg      numeric,
  pro_avg      numeric
)
language sql
security definer
set search_path = public, pg_temp
stable
as $$
  select
    r.country_iso3,
    count(*)::integer as n,
    case when count(*) >= 30 then round(avg(r.a1)::numeric, 1) end as a1_avg,
    case when count(*) >= 30 then round(avg(r.a2)::numeric, 1) end as a2_avg,
    case when count(*) >= 30 then round(avg(r.a3)::numeric, 1) end as a3_avg,
    case when count(*) >= 30 then round(avg(r.a4)::numeric, 1) end as a4_avg,
    case when count(*) >= 30 then round(avg(r.a5)::numeric, 1) end as a5_avg,
    case when count(*) >= 30 then round(avg(r.a6)::numeric, 1) end as a6_avg,
    case when count(*) >= 30
         then round(((avg(r.a1) + avg(r.a2) + avg(r.a3)) / 3)::numeric, 1)
    end as reg_avg,
    case when count(*) >= 30
         then round(((avg(r.a4) + avg(r.a5) + avg(r.a6)) / 3)::numeric, 1)
    end as pro_avg
  from public.responses r
  group by r.country_iso3;
$$;

revoke all on function public.country_results() from public;
grant execute on function public.country_results() to anon, authenticated;
