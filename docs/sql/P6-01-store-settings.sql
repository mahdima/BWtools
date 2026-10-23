-- P6-01 · Store settings (single row)
-- Run in the Supabase SQL editor (project owner). Safe to run more than once.
-- The dashboard works without this table (it falls back to the defaults below);
-- after running it, regenerate types with `npm run db:types`.

create table if not exists public.store_settings (
  id smallint primary key default 1 check (id = 1), -- exactly one row
  store_name text not null default 'BW Tools',
  contact_email text not null default 'contact@bwtools.com',
  contact_phone text,
  address text not null default 'Algeria',
  low_stock_threshold integer not null default 10 check (low_stock_threshold >= 0),
  invoice_footer text not null default 'Thank you for your business!',
  updated_at timestamptz not null default now()
);

insert into public.store_settings (id) values (1) on conflict (id) do nothing;

-- Only the dashboard's server (service role) reads and writes this table:
-- RLS on with no policies blocks the anon and authenticated roles.
alter table public.store_settings enable row level security;

-- Check
select * from public.store_settings;
