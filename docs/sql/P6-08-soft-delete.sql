-- P6-08 · Soft delete (archive) for products, brands and categories
-- Run in the Supabase SQL editor (project owner), after P6-06 (this file replaces its
-- dashboard_stats; if P6-06 is ever run again, run this file again too). Then run
-- `npm run db:types`. The dashboard detects the column: until it exists, lists show
-- everything and deleting a referenced record fails, exactly as before.
--
-- What the dashboard does once this is applied:
--   * Deleting a product that past orders, favorites or saved orders still reference
--     archives it instead. Brands and categories are archived instead of deleted when
--     only archived products still use them.
--   * Archived rows are hidden from the dashboard's lists, pickers and dashboard
--     counts, and listed under "Archived" on each page, where they can be restored.
--   * Old orders keep their order lines and product names: nothing is deleted.

begin;

alter table public.products   add column if not exists is_archived boolean not null default false;
alter table public.brands     add column if not exists is_archived boolean not null default false;
alter table public.categories add column if not exists is_archived boolean not null default false;

-- The dashboard lists active rows newest first
create index if not exists products_active_idx on public.products (product_id desc) where not is_archived;

-- Dashboard totals (replaces the P6-06 version): archived products and brands are not counted
create or replace function public.dashboard_stats(p_start timestamptz default null)
returns table (total_products bigint, total_brands bigint, total_orders bigint, total_revenue numeric)
language sql
stable
security definer
set search_path = public
as $$
  select
    (select count(*) from public.products where not is_archived),
    (select count(*) from public.brands where not is_archived),
    (select count(*) from public.orders o where p_start is null or o.created_at >= p_start),
    (select coalesce(sum(o.total), 0) from public.orders o
      where o.status is distinct from 'Cancelled' and (p_start is null or o.created_at >= p_start));
$$;

revoke all on function public.dashboard_stats(timestamptz) from public, anon, authenticated;
grant execute on function public.dashboard_stats(timestamptz) to service_role;

commit;

-- ---------------------------------------------------------------------------------
-- DECISION FOR THE OWNER: the mobile app.
-- The mobile app reads these tables directly, so it keeps showing archived products,
-- brands and categories until it filters `is_archived = false`. Either:
--   (a) update the app's queries to add `.eq('is_archived', false)` to its catalogue
--       lists (recommended: order history keeps working), or
--   (b) hide archived rows from the app's catalogue queries with RLS. Check first how
--       the app loads order history and favorites: those joins would then return NULL
--       for archived products, which the app must handle. Adapt the policy names to
--       the existing ones (see Authentication > Policies) before running:
--
-- drop policy if exists "<existing products select policy>" on public.products;
-- create policy "Public can read active products" on public.products
--   for select to anon, authenticated using (not is_archived);
-- ---------------------------------------------------------------------------------

-- Check
select count(*) filter (where is_archived) as archived, count(*) as total from public.products;
select * from public.dashboard_stats(null);
