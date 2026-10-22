-- P6-02 · Create dashboard notifications from database events
-- Run in the Supabase SQL editor (project owner) AFTER P6-01-store-settings.sql
-- (the low-stock trigger reads store_settings.low_stock_threshold).
-- New orders are created by the mobile app, so the database is the one place that
-- sees every order; doing this in a trigger also covers stock changed anywhere.

-- 1. New order -> one notification per active admin
create or replace function public.notify_admins_new_order()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.notifications (admin_id, type, title, message, link)
  select a.id,
         'new_order',
         'New Order Received',
         format('Order #%s for %s DZD', new.id, to_char(new.total, 'FM999G999G990D00')),
         format('/order/%s', new.id)
  from public.admins a
  where a.is_active is distinct from false;
  return new;
end;
$$;

drop trigger if exists orders_notify_new_order on public.orders;
create trigger orders_notify_new_order
  after insert on public.orders
  for each row execute function public.notify_admins_new_order();

-- 2. Stock falls to the low-stock threshold -> notify once, on the crossing
create or replace function public.notify_admins_low_stock()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  threshold integer;
begin
  select coalesce(s.low_stock_threshold, 10) into threshold
  from public.store_settings s where s.id = 1;
  threshold := coalesce(threshold, 10);

  if new.in_stock_vailable is not null
     and new.in_stock_vailable <= threshold
     and (old.in_stock_vailable is null or old.in_stock_vailable > threshold) then
    insert into public.notifications (admin_id, type, title, message, link)
    select a.id,
           'low_stock',
           'Low stock',
           format('%s: %s left', new.product_name, new.in_stock_vailable),
           format('/product?edit=%s', new.product_id)
    from public.admins a
    where a.is_active is distinct from false;
  end if;
  return new;
end;
$$;

drop trigger if exists products_notify_low_stock on public.products;
create trigger products_notify_low_stock
  after update of in_stock_vailable on public.products
  for each row execute function public.notify_admins_low_stock();

-- 3. Check (optional): a dry run inside a transaction that is rolled back
-- begin;
--   update public.products set in_stock_vailable = 0 where product_id = <some id>;
--   select type, title, message, link from public.notifications order by id desc limit 5;
-- rollback;
