-- Repair CREATE POLICY statements that omitted ON <table> (syntax error rolled
-- back a full schema.sql run in the SQL Editor) and bootstrap citizen profiles.
-- Fresh projects should run supabase/schema.sql instead of this file.

-- Auth sign-up creates a citizen row only. Official roles are granted in SQL
-- (see supabase/grant_admin.sql) so users cannot self-promote via metadata.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    'citizen'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;
revoke all on function public.handle_new_user() from public;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

insert into public.profiles (id, full_name, role)
select
  u.id,
  coalesce(u.raw_user_meta_data->>'full_name', split_part(u.email, '@', 1)),
  'citizen'
from auth.users u
on conflict (id) do nothing;

drop policy if exists "public read projects" on public.projects;
create policy "public read projects" on public.projects for select using (true);

drop policy if exists "public read project validations" on public.project_validations;
create policy "public read project validations" on public.project_validations for select using (true);

drop policy if exists "public read report validations" on public.report_validations;
create policy "public read report validations" on public.report_validations for select using (true);
