-- BudgetMirror AI — Sampurna District seed (idempotent; safe to re-run)
-- Run AFTER supabase/schema.sql. If this errors with "relation public.wards does
-- not exist", the schema file did not apply — re-run schema.sql first.
-- Mirrors lib/demo-data.ts so Supabase mode and demo mode tell one story.
-- Central story: Ward 5 (Ujjwal Nagar) water demand 93 vs 11% budget → alignment 31.

-- ── Wards (fixed UUIDs for idempotent re-seeds) ──────────────────────
insert into public.wards (id, ward_no, ward_name, district_name, state_name, country, lat, lng, population, vulnerability_score)
values
  ('11111111-1111-1111-1111-111111111111', 1, 'Adarsh Nagar',  'Sampurna', 'Maharashtra', 'India', 18.545, 73.841, 12500, 42),
  ('22222222-2222-2222-2222-222222222222', 2, 'Shantinagar',   'Sampurna', 'Maharashtra', 'India', 18.531, 73.869,  9800, 35),
  ('33333333-3333-3333-3333-333333333333', 3, 'Nadi Kinara',   'Sampurna', 'Maharashtra', 'India', 18.512, 73.852, 15200, 61),
  ('44444444-4444-4444-4444-444444444444', 4, 'Gadhi Mohalla', 'Sampurna', 'Maharashtra', 'India', 18.528, 73.830,  7400, 55),
  ('55555555-5555-5555-5555-555555555555', 5, 'Ujjwal Nagar',  'Sampurna', 'Maharashtra', 'India', 18.519, 73.845, 18400, 78),
  ('66666666-6666-6666-6666-666666666666', 6, 'Harit Vihar',   'Sampurna', 'Maharashtra', 'India', 18.538, 73.857, 11200, 28),
  ('77777777-7777-7777-7777-777777777777', 7, 'Market Road',   'Sampurna', 'Maharashtra', 'India', 18.524, 73.878,  9600, 33)
on conflict (id) do update set
  ward_no = excluded.ward_no, ward_name = excluded.ward_name,
  population = excluded.population, vulnerability_score = excluded.vulnerability_score;

-- ── Citizen reports (representative rows; metrics carry full counts) ─
-- tracking_id is the idempotency key.
insert into public.citizen_reports
  (tracking_id, ward_id, original_text, translated_text, language, category, sub_category, ai_summary, urgency_score, department, is_anonymous, is_actionable, ai_confidence, ai_failed, status, created_at)
values
  ('BM-2026-SEED01', '55555555-5555-5555-5555-555555555555', 'There has been no water supply in Ward 5 for three days. The school is also affected.', null, 'en', 'Water Supply', 'Piped water outage', 'Piped water outage for 3 days in Ujjwal Nagar; local school affected.', 92, 'Water Supply Department', true, true, 94, false, 'acknowledged', now() - interval '1 day'),
  ('BM-2026-SEED02', '55555555-5555-5555-5555-555555555555', 'वार्ड 5 में तीन दिन से पानी नहीं आ रहा है। स्कूल के बच्चे परेशान हैं।', 'No water in Ward 5 for three days. School children are suffering.', 'hi', 'Water Supply', 'Piped water outage', 'Hindi report: 3-day water outage; school children suffering.', 90, 'Water Supply Department', true, true, 91, false, 'new', now() - interval '1 day'),
  ('BM-2026-SEED03', '55555555-5555-5555-5555-555555555555', 'Handpump near the anganwadi has been dry for a week, women walk 2 km for water.', null, 'en', 'Water Supply', 'Handpump failure', 'Anganwadi handpump dry for a week; long water-fetching walks.', 85, 'Water Supply Department', true, true, 88, false, 'new', now() - interval '3 days'),
  ('BM-2026-SEED04', '55555555-5555-5555-5555-555555555555', 'Tanker comes only twice a week and fights break out in the queue.', null, 'en', 'Water Supply', 'Tanker shortfall', 'Water tanker frequency too low; queue conflicts reported.', 78, 'Water Supply Department', true, true, 86, false, 'new', now() - interval '4 days'),
  ('BM-2026-SEED05', '55555555-5555-5555-5555-555555555555', 'पाइपलाइन फूटी हुई है, गली में पानी बह रहा है पर घरों में नल सूखे हैं।', 'Pipeline is burst; water floods the lane but household taps are dry.', 'hi', 'Water Supply', 'Pipeline leakage', 'Burst pipeline wastes water while taps run dry.', 88, 'Water Supply Department', true, true, 90, false, 'new', now() - interval '2 days'),
  ('BM-2026-SEED06', '55555555-5555-5555-5555-555555555555', 'New decorative lights installed on every pole but our taps are dry. Priorities?', null, 'en', 'Electricity', 'Decorative lighting', 'Citizen questions decorative lighting spend amid water crisis.', 45, 'Electricity Board', true, true, 83, false, 'new', now() - interval '5 days'),
  ('BM-2026-SEED07', '55555555-5555-5555-5555-555555555555', 'Morning tap timing shifted without notice; working families miss the 5am window.', null, 'en', 'Water Supply', 'Supply timing', 'Unannounced tap-timing change hurts working families.', 66, 'Water Supply Department', true, true, 82, false, 'new', now() - interval '6 days'),
  ('BM-2026-SEED08', '55555555-5555-5555-5555-555555555555', 'Public tap near the mosque leaks all night; thousands of litres wasted.', null, 'en', 'Water Supply', 'Public tap leakage', 'Leaking public tap wastes water overnight.', 71, 'Water Supply Department', true, true, 84, false, 'new', now() - interval '7 days'),
  ('BM-2026-SEED09', '33333333-3333-3333-3333-333333333333', 'Drainage nullah overflows every monsoon, dirty water enters homes near the bridge.', null, 'en', 'Sanitation & Drainage', 'Nullah overflow', 'Monsoon nullah overflow floods homes near Nadi Kinara bridge.', 82, 'Sanitation Department', true, true, 89, false, 'new', now() - interval '6 days'),
  ('BM-2026-SEED10', '33333333-3333-3333-3333-333333333333', 'Drain desilting work started in June and stopped halfway. Stagnant water breeds mosquitoes.', null, 'en', 'Sanitation & Drainage', 'Desilting delay', 'Half-finished desilting leaves stagnant water, mosquito risk.', 76, 'Sanitation Department', true, true, 87, false, 'acknowledged', now() - interval '9 days'),
  ('BM-2026-SEED11', '33333333-3333-3333-3333-333333333333', 'नाले की सफाई अधूरी है, मच्छरों से बच्चे बीमार पड़ रहे हैं।', 'Nullah cleaning is incomplete; children fall sick from mosquitoes.', 'hi', 'Sanitation & Drainage', 'Desilting delay', 'Stalled desilting linked to child illness.', 80, 'Sanitation Department', true, true, 85, false, 'new', now() - interval '5 days'),
  ('BM-2026-SEED12', '11111111-1111-1111-1111-111111111111', 'Main road full of potholes, two accidents this month near the bus stop.', null, 'en', 'Roads & Mobility', 'Potholes', 'Pothole-ridden main road; two accidents near bus stop.', 81, 'Public Works Department', true, true, 90, false, 'new', now() - interval '2 days'),
  ('BM-2026-SEED13', '11111111-1111-1111-1111-111111111111', 'Road repair completed last month is already crumbling. Please check quality.', null, 'en', 'Roads & Mobility', 'Repair quality', 'Fresh road repair crumbling within a month; quality questioned.', 62, 'Public Works Department', true, true, 84, false, 'new', now() - interval '7 days'),
  ('BM-2026-SEED14', '11111111-1111-1111-1111-111111111111', 'Footpath near school is broken; children walk on the road with trucks passing.', null, 'en', 'Roads & Mobility', 'Footpath safety', 'Broken school footpath forces children onto truck road.', 83, 'Public Works Department', true, true, 88, false, 'new', now() - interval '3 days'),
  ('BM-2026-SEED15', '44444444-4444-4444-4444-444444444444', 'Girls toilet in the zilla parishad school has no door and no water.', null, 'en', 'Education', 'School toilets', 'ZP school girls toilet lacks door and water.', 84, 'Education Department', true, true, 92, false, 'new', now() - interval '3 days'),
  ('BM-2026-SEED16', '44444444-4444-4444-4444-444444444444', 'School roof leaks in two classrooms; benches stay wet through July.', null, 'en', 'Education', 'Classroom repair', 'Leaking school roof keeps classrooms unusable.', 74, 'Education Department', true, true, 86, false, 'new', now() - interval '8 days'),
  ('BM-2026-SEED17', '66666666-6666-6666-6666-666666666666', 'Garbage pickup skipped twice this month, bins overflow near the park.', null, 'en', 'Waste Management', 'Collection gap', 'Missed garbage pickups; park bins overflowing.', 55, 'Solid Waste Department', true, true, 85, false, 'new', now() - interval '4 days'),
  ('BM-2026-SEED18', '66666666-6666-6666-6666-666666666666', 'Segregation bins were promised but only one truck collects everything mixed.', null, 'en', 'Waste Management', 'Segregation gap', 'Mixed collection defeats segregation bins.', 48, 'Solid Waste Department', true, true, 83, false, 'new', now() - interval '10 days'),
  ('BM-2026-SEED19', '22222222-2222-2222-2222-222222222222', 'Streetlights on Station Road dont work, feels unsafe after dark.', null, 'en', 'Public Safety', 'Streetlight outage', 'Station Road streetlights out; safety concern after dark.', 68, 'Police & Civic Safety', true, true, 87, false, 'new', now() - interval '5 days'),
  ('BM-2026-SEED20', '77777777-7777-7777-7777-777777777777', 'PHC has no doctor on most days, we travel 12 km for basic treatment.', null, 'en', 'Healthcare', 'PHC staffing', 'PHC mostly without doctor; 12 km travel for basic care.', 79, 'Health Department', true, true, 89, false, 'new', now() - interval '8 days'),
  ('BM-2026-SEED21', '55555555-5555-5555-5555-555555555555', 'WIN BIG LOTTERY call this number now!!!', null, 'en', 'Water Supply', 'General', 'Spam: lottery scam, not infrastructure.', 5, 'Water Supply Department', true, false, 95, false, 'flagged', now() - interval '2 days')
on conflict (tracking_id) do nothing;

-- ── Budget allocations (fixed UUIDs; matches sample-budget.csv) ───────
insert into public.budget_allocations
  (id, ward_id, financial_year, category, sub_category, allocated_amount, spent_amount, funding_source)
values
  ('a0000000-0000-0000-0000-000000000001', '55555555-5555-5555-5555-555555555555', '2025-26', 'Water Supply', 'Pipeline maintenance', 825000, 210000, 'Municipal fund'),
  ('a0000000-0000-0000-0000-000000000002', '55555555-5555-5555-5555-555555555555', '2025-26', 'Electricity', 'Decorative / festival lighting', 4050000, 3820000, 'Municipal fund'),
  ('a0000000-0000-0000-0000-000000000003', '55555555-5555-5555-5555-555555555555', '2025-26', 'Roads & Mobility', 'Lane resurfacing', 1200000, 640000, 'State grant'),
  ('a0000000-0000-0000-0000-000000000004', '55555555-5555-5555-5555-555555555555', '2025-26', 'Waste Management', 'Collection contract', 900000, 500000, 'Municipal fund'),
  ('a0000000-0000-0000-0000-000000000005', '55555555-5555-5555-5555-555555555555', '2025-26', 'Healthcare', 'Sub-centre upkeep', 525000, 180000, 'NHM'),
  ('a0000000-0000-0000-0000-000000000006', '11111111-1111-1111-1111-111111111111', '2025-26', 'Roads & Mobility', 'Arterial repair', 3200000, 2100000, 'State grant'),
  ('a0000000-0000-0000-0000-000000000007', '11111111-1111-1111-1111-111111111111', '2025-26', 'Water Supply', 'Tank chlorination', 600000, 420000, 'Municipal fund'),
  ('a0000000-0000-0000-0000-000000000008', '33333333-3333-3333-3333-333333333333', '2025-26', 'Sanitation & Drainage', 'Nullah desilting', 1800000, 450000, 'State grant'),
  ('a0000000-0000-0000-0000-000000000009', '44444444-4444-4444-4444-444444444444', '2025-26', 'Education', 'School maintenance', 250000, 40000, 'Samagra Shiksha'),
  ('a0000000-0000-0000-0000-000000000010', '66666666-6666-6666-6666-666666666666', '2025-26', 'Waste Management', 'Collection contract', 700000, 380000, 'Municipal fund'),
  ('a0000000-0000-0000-0000-000000000011', '22222222-2222-2222-2222-222222222222', '2025-26', 'Public Safety', 'Streetlight repair', 410000, 120000, 'Municipal fund'),
  ('a0000000-0000-0000-0000-000000000012', '77777777-7777-7777-7777-777777777777', '2025-26', 'Healthcare', 'PHC staffing support', 640000, 190000, 'NHM')
on conflict (id) do update set
  allocated_amount = excluded.allocated_amount, spent_amount = excluded.spent_amount,
  sub_category = excluded.sub_category, funding_source = excluded.funding_source;

-- ── Projects ─────────────────────────────────────────────────────────
insert into public.projects
  (id, ward_id, budget_allocation_id, project_name, category, description, estimated_cost, spent_amount, status, planned_start, planned_end, actual_completion)
values
  ('d0000000-0000-0000-0000-000000000001', '33333333-3333-3333-3333-333333333333', 'a0000000-0000-0000-0000-000000000008', 'Nadi Kinara nullah desilting (Phase 2)', 'Sanitation & Drainage', 'Desilt 2.4 km of the monsoon nullah and rebuild two culverts near the bridge.', 1800000, 450000, 'Delayed', '2025-06-15', '2025-09-30', null),
  ('d0000000-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111', 'a0000000-0000-0000-0000-000000000006', 'Adarsh Nagar arterial resurfacing', 'Roads & Mobility', 'Resurface 3.1 km arterial road including bus-stop bay and drainage crossfalls.', 3200000, 2100000, 'In Progress', '2025-07-01', '2025-12-15', null),
  ('d0000000-0000-0000-0000-000000000003', '55555555-5555-5555-5555-555555555555', 'a0000000-0000-0000-0000-000000000002', 'Ujjwal Nagar decorative lighting', 'Electricity', 'Ornamental LED poles across main lanes and the community hall frontage.', 4050000, 3820000, 'Completed', '2025-04-01', '2025-08-31', '2025-08-28'),
  ('d0000000-0000-0000-0000-000000000004', '55555555-5555-5555-5555-555555555555', 'a0000000-0000-0000-0000-000000000001', 'Ujjwal Nagar pipeline rehabilitation (proposed)', 'Water Supply', 'Replace 1.8 km of leaking distribution pipeline and repair 6 standposts. Proposed — awaiting funding decision.', 1200000, 0, 'Planned', null, null, null),
  ('d0000000-0000-0000-0000-000000000005', '66666666-6666-6666-6666-666666666666', 'a0000000-0000-0000-0000-000000000010', 'Harit Vihar segregated collection pilot', 'Waste Management', 'Door-to-door segregated pickup with two compactors; citizen rating pilot.', 700000, 380000, 'Citizen Validation Pending', '2025-05-01', '2025-09-15', '2025-09-12')
on conflict (id) do update set
  status = excluded.status, spent_amount = excluded.spent_amount, description = excluded.description;

-- ── Project validations ──────────────────────────────────────────────
insert into public.project_validations (project_id, rating, issue_resolved, feedback, created_at)
select 'd0000000-0000-0000-0000-000000000005', 4, 'yes', 'Pickup is regular now on our lane.', now() - interval '8 days'
where not exists (select 1 from public.project_validations where project_id = 'd0000000-0000-0000-0000-000000000005' and feedback = 'Pickup is regular now on our lane.');
insert into public.project_validations (project_id, rating, issue_resolved, feedback, created_at)
select 'd0000000-0000-0000-0000-000000000005', 5, 'yes', 'Bins near the park are cleared daily.', now() - interval '7 days'
where not exists (select 1 from public.project_validations where project_id = 'd0000000-0000-0000-0000-000000000005' and feedback = 'Bins near the park are cleared daily.');
insert into public.project_validations (project_id, rating, issue_resolved, feedback, created_at)
select 'd0000000-0000-0000-0000-000000000005', 3, 'partial', 'Better, but Sunday pickup still missed.', now() - interval '6 days'
where not exists (select 1 from public.project_validations where project_id = 'd0000000-0000-0000-0000-000000000005' and feedback = 'Better, but Sunday pickup still missed.');
insert into public.project_validations (project_id, rating, issue_resolved, feedback, created_at)
select 'd0000000-0000-0000-0000-000000000003', 2, 'no', 'Pretty lights, but taps are dry. Wrong priority.', now() - interval '19 days'
where not exists (select 1 from public.project_validations where project_id = 'd0000000-0000-0000-0000-000000000003' and feedback = 'Pretty lights, but taps are dry. Wrong priority.');
insert into public.project_validations (project_id, rating, issue_resolved, feedback, created_at)
select 'd0000000-0000-0000-0000-000000000003', 3, 'partial', 'Lane looks nice at night.', now() - interval '18 days'
where not exists (select 1 from public.project_validations where project_id = 'd0000000-0000-0000-0000-000000000003' and feedback = 'Lane looks nice at night.');
insert into public.project_validations (project_id, rating, issue_resolved, feedback, created_at)
select 'd0000000-0000-0000-0000-000000000001', 1, 'no', 'Work stopped halfway, water still stagnates.', now() - interval '14 days'
where not exists (select 1 from public.project_validations where project_id = 'd0000000-0000-0000-0000-000000000001' and feedback = 'Work stopped halfway, water still stagnates.');

-- ── Precomputed ward × category metrics (headline story; recalc refreshes)
insert into public.ward_category_metrics
  (ward_id, category, period, demand_score, demand_share, budget_share, alignment_score, mismatch_score, priority_score, report_count, allocated_amount, spent_amount, calculated_at)
values
  ('55555555-5555-5555-5555-555555555555', 'Water Supply', '2025-26', 93, 0.80, 0.11, 31, 69, 86, 147, 825000, 210000, now()),
  ('55555555-5555-5555-5555-555555555555', 'Electricity', '2025-26', 8, 0.03, 0.54, 49, 51, 22, 6, 4050000, 3820000, now()),
  ('55555555-5555-5555-5555-555555555555', 'Roads & Mobility', '2025-26', 41, 0.09, 0.16, 93, 7, 38, 18, 1200000, 640000, now()),
  ('55555555-5555-5555-5555-555555555555', 'Waste Management', '2025-26', 35, 0.06, 0.12, 94, 6, 30, 11, 900000, 500000, now()),
  ('55555555-5555-5555-5555-555555555555', 'Healthcare', '2025-26', 22, 0.02, 0.07, 95, 5, 18, 4, 525000, 180000, now()),
  ('11111111-1111-1111-1111-111111111111', 'Roads & Mobility', '2025-26', 78, 0.62, 0.55, 93, 7, 64, 52, 3200000, 2100000, now()),
  ('11111111-1111-1111-1111-111111111111', 'Water Supply', '2025-26', 34, 0.21, 0.18, 97, 3, 28, 14, 600000, 420000, now()),
  ('33333333-3333-3333-3333-333333333333', 'Sanitation & Drainage', '2025-26', 81, 0.71, 0.44, 73, 27, 72, 44, 1800000, 450000, now()),
  ('44444444-4444-4444-4444-444444444444', 'Education', '2025-26', 76, 0.66, 0.09, 43, 57, 74, 29, 250000, 40000, now()),
  ('66666666-6666-6666-6666-666666666666', 'Waste Management', '2025-26', 48, 0.42, 0.38, 96, 4, 40, 21, 700000, 380000, now()),
  ('22222222-2222-2222-2222-222222222222', 'Public Safety', '2025-26', 58, 0.50, 0.20, 70, 30, 55, 19, 410000, 120000, now()),
  ('77777777-7777-7777-7777-777777777777', 'Healthcare', '2025-26', 69, 0.58, 0.24, 66, 34, 61, 25, 640000, 190000, now())
on conflict (ward_id, category, period) do update set
  demand_score = excluded.demand_score, demand_share = excluded.demand_share,
  budget_share = excluded.budget_share, alignment_score = excluded.alignment_score,
  mismatch_score = excluded.mismatch_score, priority_score = excluded.priority_score,
  report_count = excluded.report_count, allocated_amount = excluded.allocated_amount,
  spent_amount = excluded.spent_amount, calculated_at = now();
