-- Apply to existing Supabase projects before deploying the admin hotfix.
-- Fresh projects get the same policies from supabase/schema.sql.

-- Official roles come only from profiles, never from user-editable auth metadata.
-- SECURITY DEFINER avoids RLS recursion; this no-argument function only checks auth.uid().
create or replace function public.is_official()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and role in ('admin', 'policymaker')
  );
$$;
revoke all on function public.is_official() from public;
grant execute on function public.is_official() to authenticated;

-- Service-role writes still need server-side checks; direct authenticated API access
-- must also be restricted by RLS to officials.
drop policy if exists "authenticated update reports" on public.citizen_reports;
drop policy if exists "official update reports" on public.citizen_reports;
create policy "official update reports" on public.citizen_reports
  for update using (public.is_official()) with check (public.is_official());

drop policy if exists "authenticated manage budgets" on public.budget_allocations;
drop policy if exists "official manage budgets" on public.budget_allocations;
create policy "official manage budgets" on public.budget_allocations
  for all using (public.is_official()) with check (public.is_official());

drop policy if exists "authenticated manage uploads" on public.budget_uploads;
drop policy if exists "official manage uploads" on public.budget_uploads;
create policy "official manage uploads" on public.budget_uploads
  for all using (public.is_official()) with check (public.is_official());

drop policy if exists "authenticated manage projects" on public.projects;
drop policy if exists "official manage projects" on public.projects;
create policy "official manage projects" on public.projects
  for all using (public.is_official()) with check (public.is_official());

drop policy if exists "authenticated manage metrics" on public.ward_category_metrics;
drop policy if exists "official manage metrics" on public.ward_category_metrics;
create policy "official manage metrics" on public.ward_category_metrics
  for all using (public.is_official()) with check (public.is_official());

drop policy if exists "users read own profile" on public.profiles;
create policy "users read own profile" on public.profiles
  for select using (auth.uid() = id);

-- Users may create a citizen profile, but cannot grant themselves an official role.
drop policy if exists "users upsert own profile" on public.profiles;
drop policy if exists "users insert citizen profile" on public.profiles;
create policy "users insert citizen profile" on public.profiles
  for insert with check (auth.uid() = id and role = 'citizen');

-- Storage: budget docs official-only; evidence open for anon insert, public read off
drop policy if exists "authenticated read budget docs" on storage.objects;
drop policy if exists "official read budget docs" on storage.objects;
create policy "official read budget docs" on storage.objects
  for select using (bucket_id = 'budget-docs' and public.is_official());

drop policy if exists "authenticated write budget docs" on storage.objects;
drop policy if exists "official write budget docs" on storage.objects;
create policy "official write budget docs" on storage.objects
  for insert with check (bucket_id = 'budget-docs' and public.is_official());
