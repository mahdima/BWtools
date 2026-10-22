-- P7-02 · Reports: totals for any window, and sales per product / category / brand
-- Run in the Supabase SQL editor (project owner). The dashboard uses these functions
-- when they exist and computes the same figures from order rows until then.
--
-- Definitions (the same as the dashboard's):
--   * orders  = every order created in the window, whatever its status
--   * revenue = order totals of orders that are not cancelled (NULL status counts)
--   * sales   = order lines (quantity × unit_price, the price paid) of orders that are
--               not cancelled. Order totals also include delivery, so sales are lower.

create or replace function public.period_totals(p_start timestamptz, p_end timestamptz)
returns table (total_orders bigint, total_revenue numeric)
language sql
stable
security definer
set search_path = public
as $$
  select count(*),
         coalesce(sum(o.total) filter (where o.status is distinct from 'Cancelled'), 0)
  from public.orders o
  where o.created_at >= p_start and o.created_at < p_end;
$$;

-- p_group: 'product', 'category' or 'brand'. A NULL window bound means unbounded.
create or replace function public.sales_by(
  p_group text,
  p_start timestamptz default null,
  p_end timestamptz default null
)
returns table (group_id bigint, label text, quantity bigint, revenue numeric)
language sql
stable
security definer
set search_path = public
as $$
  select
    case p_group
      when 'product' then oi.product_id::bigint
      when 'category' then p."Category_id"::bigint
      else p.brand_id::bigint
    end,
    case p_group
      when 'product' then p.product_name::text
      when 'category' then c.categorie_name::text
      else b.brand_name::text
    end,
    sum(oi.quantity)::bigint,
    sum(oi.quantity * oi.unit_price)::numeric
  from public.order_items oi
  join public.orders o on o.id = oi.order_id
  left join public.products p on p.product_id = oi.product_id
  left join public.categories c on c.categorie_id = p."Category_id"
  left join public.brands b on b.brand_id = p.brand_id
  where p_group in ('product', 'category', 'brand')
    and o.status is distinct from 'Cancelled'
    and (p_start is null or o.created_at >= p_start)
    and (p_end is null or o.created_at < p_end)
  group by 1, 2
  order by 4 desc, 3 desc;
$$;

-- Only the dashboard's server (service role) may call them
revoke all on function public.period_totals(timestamptz, timestamptz) from public, anon, authenticated;
revoke all on function public.sales_by(text, timestamptz, timestamptz) from public, anon, authenticated;
grant execute on function public.period_totals(timestamptz, timestamptz) to service_role;
grant execute on function public.sales_by(text, timestamptz, timestamptz) to service_role;

-- Check
select * from public.period_totals(now() - interval '60 days', now() - interval '30 days');
select * from public.sales_by('category');
