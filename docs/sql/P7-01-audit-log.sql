-- P7-01 · Audit log: who changed what in the dashboard
-- Run in the Supabase SQL editor (project owner), then `npm run db:types`.
-- Until the table exists the dashboard skips logging, and /audit says it isn't set up.

begin;

create table if not exists public.audit_log (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  -- The admin who acted; kept (as NULL) if that admin row is ever deleted
  admin_id uuid references public.admins (id) on delete set null,
  action text not null,     -- create, update, delete, archive, restore, status_change, ...
  entity text not null,     -- product, brand, category, order, customer, admin, store_settings
  entity_id text,
  changes jsonb             -- e.g. {"unite_price": {"from": 1200, "to": 1500}}
);

create index if not exists audit_log_created_at_idx on public.audit_log (created_at desc);
create index if not exists audit_log_entity_idx on public.audit_log (entity, entity_id);

-- Only the dashboard's server (service role) reads and writes it
alter table public.audit_log enable row level security;
revoke all on table public.audit_log from anon, authenticated;

-- Append-only: entries can't be edited or deleted through the API
create or replace function public.audit_log_is_append_only()
returns trigger
language plpgsql
as $$
begin
  raise exception 'audit_log is append-only';
end;
$$;

drop trigger if exists audit_log_append_only on public.audit_log;
create trigger audit_log_append_only
  before update or delete on public.audit_log
  for each statement execute function public.audit_log_is_append_only();

commit;

-- Check (after doing something in the dashboard)
select created_at, action, entity, entity_id, changes from public.audit_log order by created_at desc limit 20;
