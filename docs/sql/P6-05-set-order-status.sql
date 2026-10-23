-- P6-05 · Change an order's status and record its history in one transaction
-- Run in the Supabase SQL editor (project owner). The dashboard calls this function
-- when it exists and falls back to separate queries until then.

create or replace function public.set_order_status(p_order_id bigint, p_new_status text, p_admin_id uuid)
returns text -- the previous status
language plpgsql
security definer
set search_path = public
as $$
declare
  v_old text;
begin
  if p_new_status not in ('New', 'processing', 'Delivering', 'Delivered', 'Cancelled') then
    raise exception 'invalid order status: %', p_new_status using errcode = '22023';
  end if;

  -- Lock the order so two admins changing it at once are applied one after the other
  select status into v_old from public.orders where id = p_order_id for update;
  if not found then
    raise exception 'order % not found', p_order_id using errcode = 'P0002';
  end if;

  update public.orders set status = p_new_status where id = p_order_id;

  insert into public.order_status_history (order_id, old_status, new_status, changed_by)
  values (p_order_id, v_old, p_new_status, p_admin_id);

  -- OPTIONAL stock movement. First confirm that neither the mobile app nor another
  -- trigger already adjusts stock (doing it twice corrupts inventory). Then uncomment:
  --
  -- if p_new_status = 'Cancelled' and v_old is distinct from 'Cancelled' then
  --   -- cancelled: put the items back in stock
  --   update public.products p
  --   set in_stock_vailable = coalesce(p.in_stock_vailable, 0) + oi.quantity
  --   from public.order_items oi
  --   where oi.order_id = p_order_id and oi.product_id = p.product_id;
  -- elsif v_old = 'Cancelled' and p_new_status <> 'Cancelled' then
  --   -- un-cancelled: take them out again
  --   update public.products p
  --   set in_stock_vailable = coalesce(p.in_stock_vailable, 0) - oi.quantity
  --   from public.order_items oi
  --   where oi.order_id = p_order_id and oi.product_id = p.product_id;
  -- end if;

  return v_old;
end;
$$;

-- Only the dashboard's server (service role) may call it
revoke all on function public.set_order_status(bigint, text, uuid) from public, anon, authenticated;
grant execute on function public.set_order_status(bigint, text, uuid) to service_role;
