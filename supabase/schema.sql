-- BudgetMirror AI — Supabase PostgreSQL schema (MVP + stretch tables)
-- Run in the Supabase SQL editor (or `supabase db push` if using the CLI).
-- Idempotent: safe to re-run (CREATE IF NOT EXISTS + policy drops).

-- ── Helper: updated_at trigger ──────────────────────────────────────
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end; $$;

-- ── Wards ────────────────────────────────────────────────────────────
create table if not exists public.wards (
  id uuid primary key default gen_random_uuid(),
  ward_no int,
  ward_name text not null,
  district_name text not null default 'Sampurna',
  state_name text not null default 'Maharashtra',
  country text not null default 'India',
  lat double precision,
  lng double precision,
  population int,
  vulnerability_score int check (vulnerability_score is null or (vulnerability_score between 0 and 100)),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (district_name, ward_name)
);
create index if not exists wards_district_idx on public.wards (district_name);
drop trigger if exists wards_updated_at on public.wards;
create trigger wards_updated_at before update on public.wards
  for each row execute function public.set_updated_at();

-- ── Profiles (optional login; role gates the admin workspace) ───────
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  role text not null default 'citizen' check (role in ('citizen','admin','policymaker')),
  organization text,
  created_at timestamptz not null default now()
);

-- ── Citizen reports ──────────────────────────────────────────────────
create table if not exists public.citizen_reports (
  id uuid primary key default gen_random_uuid(),
  tracking_id text unique,
  ward_id uuid references public.wards (id) on delete set null,
  submitted_by uuid references auth.users (id) on delete set null,
  original_text text not null check (char_length(original_text) between 10 and 2000),
  translated_text text,
  language text,
  category text not null,
  sub_category text,
  ai_summary text,
  urgency_score int check (urgency_score is null or (urgency_score between 0 and 100)),
  department text,
  is_anonymous boolean not null default true,
  is_actionable boolean,
  ai_confidence int check (ai_confidence is null or (ai_confidence between 0 and 100)),
  ai_failed boolean not null default false,
  status text not null default 'new'
    check (status in ('new','under_review','acknowledged','resolved','flagged')),
  lat double precision,
  lng double precision,
  created_at timestamptz not null default now()
);
create index if not exists reports_ward_idx on public.citizen_reports (ward_id);
create index if not exists reports_category_idx on public.citizen_reports (category);
create index if not exists reports_status_idx on public.citizen_reports (status);
create index if not exists reports_created_idx on public.citizen_reports (created_at desc);

-- ── Report validations (community corroboration) ─────────────────────
create table if not exists public.report_validations (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null references public.citizen_reports (id) on delete cascade,
  user_id uuid references auth.users (id) on delete set null,
  is_same_issue boolean not null default true,
  created_at timestamptz not null default now()
);
create index if not exists report_validations_report_idx on public.report_validations (report_id);

-- ── Budget uploads (parser receipts; rows enter ledger only on approve)
create table if not exists public.budget_uploads (
  id uuid primary key default gen_random_uuid(),
  file_name text not null,
  file_url text,
  source_type text not null check (source_type in ('csv','pdf')),
  financial_year text not null,
  extraction_status text not null default 'pending'
    check (extraction_status in ('pending','review','approved','rejected','failed')),
  row_count int,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);

-- ── Budget allocations ───────────────────────────────────────────────
create table if not exists public.budget_allocations (
  id uuid primary key default gen_random_uuid(),
  ward_id uuid references public.wards (id) on delete set null,
  budget_upload_id uuid references public.budget_uploads (id) on delete set null,
  financial_year text not null,
  category text not null,
  sub_category text,
  allocated_amount numeric not null default 0 check (allocated_amount >= 0),
  spent_amount numeric not null default 0 check (spent_amount >= 0),
  funding_source text,
  created_at timestamptz not null default now()
);
create index if not exists budgets_ward_idx on public.budget_allocations (ward_id);
create index if not exists budgets_category_idx on public.budget_allocations (category);
create index if not exists budgets_fy_idx on public.budget_allocations (financial_year);

-- ── Projects ─────────────────────────────────────────────────────────
create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  ward_id uuid references public.wards (id) on delete set null,
  budget_allocation_id uuid references public.budget_allocations (id) on delete set null,
  project_name text not null,
  category text not null,
  description text,
  estimated_cost numeric check (estimated_cost is null or estimated_cost >= 0),
  spent_amount numeric check (spent_amount is null or spent_amount >= 0),
  status text not null default 'Planned'
    check (status in ('Planned','Funded','In Progress','Delayed','Completed',
                      'Citizen Validation Pending','Impact Verified','Needs Review')),
  planned_start date,
  planned_end date,
  actual_completion date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists projects_ward_idx on public.projects (ward_id);
create index if not exists projects_status_idx on public.projects (status);
drop trigger if exists projects_updated_at on public.projects;
create trigger projects_updated_at before update on public.projects
  for each row execute function public.set_updated_at();

-- ── Project validations ──────────────────────────────────────────────
create table if not exists public.project_validations (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  user_id uuid references auth.users (id) on delete set null,
  rating int not null check (rating between 1 and 5),
  issue_resolved text not null check (issue_resolved in ('yes','partial','no')),
  feedback text check (feedback is null or char_length(feedback) <= 500),
  created_at timestamptz not null default now()
);
create index if not exists project_validations_project_idx on public.project_validations (project_id);

-- ── Ward × category metrics (recomputed deterministically) ───────────
create table if not exists public.ward_category_metrics (
  id uuid primary key default gen_random_uuid(),
  ward_id uuid not null references public.wards (id) on delete cascade,
  category text not null,
  period text not null,
  demand_score int not null default 0,
  demand_share double precision,
  budget_share double precision,
  alignment_score int,
  mismatch_score int,
  priority_score int,
  report_count int not null default 0,
  allocated_amount numeric not null default 0,
  spent_amount numeric not null default 0,
  calculated_at timestamptz not null default now(),
  unique (ward_id, category, period)
);
create index if not exists metrics_ward_period_idx on public.ward_category_metrics (ward_id, period);
create index if not exists metrics_priority_idx on public.ward_category_metrics (priority_score desc);

-- ── Storage buckets ──────────────────────────────────────────────────
insert into storage.buckets (id, name, public)
values ('budget-docs', 'budget-docs', false)
on conflict (id) do nothing;
insert into storage.buckets (id, name, public)
values ('evidence', 'evidence', false)
on conflict (id) do nothing;

-- ════════════ Row Level Security ════════════
alter table public.wards enable row level security;
alter table public.profiles enable row level security;
alter table public.citizen_reports enable row level security;
alter table public.report_validations enable row level security;
alter table public.budget_uploads enable row level security;
alter table public.budget_allocations enable row level security;
alter table public.projects enable row level security;
alter table public.project_validations enable row level security;
alter table public.ward_category_metrics enable row level security;

-- Public read: anonymised civic data
drop policy if exists "public read wards" on public.wards;
create policy "public read wards" on public.wards for select using (true);

drop policy if exists "public read reports" on public.citizen_reports;
create policy "public read reports" on public.citizen_reports
  for select using (status <> 'flagged' or auth.role() = 'authenticated');

drop policy if exists "anon insert reports" on public.citizen_reports;
create policy "anon insert reports" on public.citizen_reports
  for insert with check (
    submitted_by is null and is_anonymous = true
    and char_length(original_text) between 10 and 2000
  );

drop policy if exists "public read allocations" on public.budget_allocations;
create policy "public read allocations" on public.budget_allocations for select using (true);

drop policy if exists "public read projects" on public.projects;
create policy "public read projects" for select using (true);

drop policy if exists "public read project validations" on public.project_validations;
create policy "public read project validations" for select using (true);

drop policy if exists "anon insert project validations" on public.project_validations;
create policy "anon insert project validations" on public.project_validations
  for insert with check (user_id is null and rating between 1 and 5);

drop policy if exists "public read metrics" on public.ward_category_metrics;
create policy "public read metrics" on public.ward_category_metrics for select using (true);

drop policy if exists "public read report validations" on public.report_validations;
create policy "public read report validations" for select using (true);

-- Authenticated writes (service role bypasses RLS for trusted server writes)
drop policy if exists "authenticated update reports" on public.citizen_reports;
create policy "authenticated update reports" on public.citizen_reports
  for update using (auth.role() = 'authenticated');

drop policy if exists "authenticated manage budgets" on public.budget_allocations;
create policy "authenticated manage budgets" on public.budget_allocations
  for all using (auth.role() = 'authenticated');

drop policy if exists "authenticated manage uploads" on public.budget_uploads;
create policy "authenticated manage uploads" on public.budget_uploads
  for all using (auth.role() = 'authenticated');

drop policy if exists "authenticated manage projects" on public.projects;
create policy "authenticated manage projects" for all using (auth.role() = 'authenticated');

drop policy if exists "authenticated manage metrics" on public.ward_category_metrics;
create policy "authenticated manage metrics" on public.ward_category_metrics
  for all using (auth.role() = 'authenticated');

drop policy if exists "users read own profile" on public.profiles;
create policy "users read own profile" on public.profiles
  for select using (auth.uid() = id);

drop policy if exists "users upsert own profile" on public.profiles;
create policy "users upsert own profile" on public.profiles
  for insert with check (auth.uid() = id);

-- Storage: budget docs admin-only; evidence open for anon insert, public read off
drop policy if exists "authenticated read budget docs" on storage.objects;
create policy "authenticated read budget docs" on storage.objects
  for select using (bucket_id = 'budget-docs' and auth.role() = 'authenticated');

drop policy if exists "authenticated write budget docs" on storage.objects;
create policy "authenticated write budget docs" on storage.objects
  for insert with check (bucket_id = 'budget-docs' and auth.role() = 'authenticated');

drop policy if exists "anon insert evidence" on storage.objects;
create policy "anon insert evidence" on storage.objects
  for insert with check (bucket_id = 'evidence');
