-- P1-07 · Stop the public anon key from reading customer data
-- Run in the Supabase SQL editor (project owner). Review each step before running it.
--
-- Found 2026-10-22 with count-only requests using the anon key (the key that ships in the mobile app):
--   profiles_with_email -> all 16 rows readable (customer emails and phones)
--   profiles            -> all 16 rows readable
--   admins              -> HTTP 500 (no data returned, but its RLS policy is probably broken/recursive)
--   orders, order_items, order_notes, order_status_history, notifications -> 0 rows (protected)
-- Since P1-07 the dashboard reads customers through the service role, so it does not need anon access.

-- 1. The customer view is only used by the dashboard. Views run with their owner's rights
--    and bypass RLS on the underlying tables, so revoke direct access entirely.
revoke all on public.profiles_with_email from anon, authenticated;

-- 2. profiles: list the current policies first.
select policyname, cmd, roles, qual, with_check
from pg_policies
where schemaname = 'public' and tablename = 'profiles';

--    If a SELECT policy has qual = 'true' (for example Supabase's template
--    "Public profiles are viewable by everyone"), every visitor can read every profile.
--    Before changing it, confirm with the mobile app owner that the app only reads
--    the signed-in user's own profile. Then replace it:
--
-- drop policy "<policy name from the query above>" on public.profiles;
-- create policy "Users can read their own profile" on public.profiles
--   for select to authenticated using (auth.uid() = id);

-- 3. admins: diagnose the HTTP 500 (likely "infinite recursion detected in policy").
select policyname, cmd, roles, qual, with_check
from pg_policies
where schemaname = 'public' and tablename = 'admins';

--    The dashboard reads admins only through the service role, so a safe policy set is
--    "no access for anon/authenticated": drop the recursive policies and keep RLS enabled.

-- 4. Re-check from a terminal (should print 401/403, or a range ending in /0):
--   curl -sI "$SUPABASE_URL/rest/v1/profiles_with_email?select=id" \
--     -H "apikey: $ANON_KEY" -H "Authorization: Bearer $ANON_KEY" -H "Prefer: count=exact"
