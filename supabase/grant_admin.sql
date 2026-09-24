-- Promote an existing Auth user to admin or policymaker.
-- Creating the user in Authentication is not enough: /admin reads public.profiles.role.
-- The SQL Editor runs as a privileged role and bypasses RLS (users cannot self-promote).
--
-- 1. Authentication → Users → Add user (email/password).
-- 2. Replace REPLACE_WITH_OFFICIAL_EMAIL below.
-- 3. Run this entire file.

do $$
declare
  official_email text := 'REPLACE_WITH_OFFICIAL_EMAIL';
  official_role text := 'admin'; -- or 'policymaker'
  promoted int;
begin
  if official_email is null
     or official_email = 'REPLACE_WITH_OFFICIAL_EMAIL'
     or position('@' in official_email) = 0 then
    raise exception 'Set official_email in grant_admin.sql to the Auth user email first.';
  end if;

  if official_role not in ('admin', 'policymaker') then
    raise exception 'official_role must be admin or policymaker.';
  end if;

  insert into public.profiles (id, full_name, role, organization)
  select
    u.id,
    coalesce(u.raw_user_meta_data->>'full_name', split_part(u.email, '@', 1)),
    official_role,
    'Sampurna District'
  from auth.users u
  where lower(u.email) = lower(official_email)
  on conflict (id) do update
    set role = excluded.role,
        organization = coalesce(public.profiles.organization, excluded.organization);

  get diagnostics promoted = row_count;
  if promoted = 0 then
    raise exception 'No auth.users row for %. Create the user in Authentication first.', official_email;
  end if;
end $$;
