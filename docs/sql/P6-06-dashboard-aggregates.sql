-- P6-06 · Dashboard totals computed by the database
-- Run in the Supabase SQL editor (project owner). The dashboard uses these functions
-- when they exist and falls back to summing order rows itself until then.
-- "Revenue" = orders that are not cancelled (a missing status counts as not cancelled).

create or replace function public.dashboard_stats(p_start timestamptz default null)
returns table (total_products bigint, total_brands bigint, total_orders bigint, total_revenue numeric)
language sql
stable
security definer
set search_path = public
as $$
  select
    (select count(*) from public.products),
    (select count(*) from public.brands),
    (select count(*) from public.orders o where p_start is null or o.created_at >= p_start),
    (select coalesce(sum(o.total), 0) from public.orders o
      where o.status is distinct from 'Cancelled' and (p_start is null or o.created_at >= p_start));
$$;

-- Revenue per day / week (Monday) / month, bucketed in the store's time zone.
create or replace function public.revenue_series(
  p_start timestamptz,
  p_bucket text,
  p_time_zone text default 'Africa/Algiers'
)
returns table (bucket_start date, total numeric)
language sql
stable
security definer
set search_path = public
as $$
  select date_trunc(p_bucket, o.created_at at time zone p_time_zone)::date as bucket_start,
         sum(o.total) as total
  from public.orders o
  where p_bucket in ('day', 'week', 'month')
    and o.status is distinct from 'Cancelled'
    and (p_start is null or o.created_at >= p_start)
  group by 1
  order by 1;
$$;

-- Only the dashboard's server (service role) may call them
revoke all on function public.dashboard_stats(timestamptz) from public, anon, authenticated;
revoke all on function public.revenue_series(timestamptz, text, text) from public, anon, authenticated;
grant execute on function public.dashboard_stats(timestamptz) to service_role;
grant execute on function public.revenue_series(timestamptz, text, text) to service_role;

-- Check
select * from public.dashboard_stats(now() - interval '30 days');
select * from public.revenue_series(now() - interval '7 days', 'day');
