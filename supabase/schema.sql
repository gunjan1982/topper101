-- Topper101 Supabase Schema

-- Courses (read-only for all authenticated users)
create table courses (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,           -- e.g. 'MPC-001'
  name text not null,
  year integer not null,               -- 1 or 2
  stream text,                         -- NULL for Year 1, 'Counselling'|'Clinical'|'Organisational' for Year 2
  description text,
  course_type text default 'theory' check (course_type in ('theory', 'practical', 'internship', 'project')),
  section_format jsonb                 -- e.g. {"A": {"marks": 10, "count": 2}, "B": {"marks": 6, "count": 4}, "C": {"marks": 3, "count": 2}}
);

-- Topic clusters (frequency lives here, not on individual questions)
create table topic_clusters (
  id uuid primary key default gen_random_uuid(),
  course_id uuid references courses(id) on delete cascade,
  cluster_name text not null,
  description text,
  frequency_count integer default 0,   -- how many unique year+session combos this cluster appears in
  frequency_tier text check (frequency_tier in ('HIGH', 'MEDIUM', 'LOW'))
);

-- Questions
create table questions (
  id uuid primary key default gen_random_uuid(),
  course_id uuid references courses(id) on delete cascade,
  topic_cluster_id uuid references topic_clusters(id),
  year integer not null,               -- e.g. 2023
  session text not null check (session in ('June', 'December')),
  section text not null,               -- 'A', 'B', or 'C'
  question_text text not null,
  marks integer not null,
  ai_answer text,
  ai_model_used text,                  -- e.g. 'gpt-4o'
  answer_status text default 'draft' check (answer_status in ('draft', 'reviewed', 'published')),
  textbook_grounded boolean default false, -- true when answer was generated with IGNOU textbook chunks as context
  repeat_family_key text,              -- exact/near-exact repeated question family
  repeat_family_label text,            -- display label for repeat_family_key
  study_hook_key text,                 -- broader high-yield preparation hook
  study_hook_label text,               -- display label for study_hook_key
  repeat_algo_version text,            -- algorithm version used for persisted intelligence
  repeat_intelligence_updated_at timestamptz,
  repeat_intelligence_reviewed_at timestamptz,
  reviewed_by text,
  reviewed_at timestamptz,
  created_at timestamptz default now()
);

-- User entitlements for free subject unlocks, referral rewards, purchases, and admin grants
create table user_entitlements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  entitlement_type text not null check (entitlement_type in ('subject_unlock', 'answer_credit')),
  course_code text references courses(code) on delete cascade,
  quantity integer,
  source text not null check (source in ('signup_free', 'referral', 'purchase', 'admin')),
  source_ref text,
  metadata jsonb not null default '{}'::jsonb,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  unique (user_id, entitlement_type, course_code, source)
);

create index if not exists user_entitlements_user_idx
  on user_entitlements (user_id);

create index if not exists user_entitlements_subject_idx
  on user_entitlements (user_id, course_code)
  where entitlement_type = 'subject_unlock';

-- Referral records qualify after the referred user signs up and completes useful onboarding activity
create table referrals (
  id uuid primary key default gen_random_uuid(),
  referrer_user_id uuid references users(id) on delete cascade,
  referred_user_id uuid references users(id) on delete cascade,
  referral_code text not null,
  status text not null default 'pending' check (status in ('pending', 'qualified', 'rewarded', 'rejected')),
  referrer_reward_entitlement_id uuid references user_entitlements(id) on delete set null,
  referred_reward_entitlement_id uuid references user_entitlements(id) on delete set null,
  qualified_at timestamptz,
  rewarded_at timestamptz,
  created_at timestamptz not null default now(),
  unique (referred_user_id)
);

create index if not exists referrals_referrer_idx
  on referrals (referrer_user_id, status);

create index if not exists questions_course_repeat_family_idx
  on questions (course_id, repeat_family_key);

create index if not exists questions_course_study_hook_idx
  on questions (course_id, study_hook_key);

-- Concept tree nodes (7-layer psychology framework)
create table concept_tree (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid references concept_tree(id),
  layer integer not null check (layer between 1 and 7),
  domain text not null,                -- e.g. 'Cognitive Architecture'
  name text not null,                  -- e.g. 'Working Memory'
  definition text,
  key_theorists jsonb,                 -- e.g. ["Baddeley", "Hitch"]
  clinical_relevance text,
  exam_relevance text check (exam_relevance in ('HIGH', 'MEDIUM', 'LOW')),
  mapped_courses jsonb,                -- e.g. ["MPC-001"]
  related_nodes jsonb,                 -- array of concept_tree UUIDs
  sample_answer_hook text,
  -- Added v2: pipeline-linked fields
  course_primary_code text references courses(code) on delete set null,
  topic_cluster_id uuid,               -- FK to topic_clusters set after pipeline run
  linked_question_ids jsonb default '[]'::jsonb  -- Supabase question UUIDs linked to this node
);

create index if not exists concept_tree_course_idx
  on concept_tree (course_primary_code);

create index if not exists concept_tree_cluster_idx
  on concept_tree (topic_cluster_id);

-- Migration note (run in Supabase SQL editor if table already exists):
-- alter table concept_tree add column if not exists course_primary_code text references courses(code) on delete set null;
-- alter table concept_tree add column if not exists topic_cluster_id uuid;
-- alter table concept_tree add column if not exists linked_question_ids jsonb default '[]'::jsonb;
-- create index if not exists concept_tree_course_idx on concept_tree (course_primary_code);
-- create index if not exists concept_tree_cluster_idx on concept_tree (topic_cluster_id);

-- Migration note for users table (run in Supabase SQL editor if table already exists):
-- alter table users add column if not exists urna_opt_in boolean default false;

-- Users (extends Supabase auth.users)
create table users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  name text,
  phone text,
  auth_provider text,                  -- 'email' or 'google'
  stream text,                         -- 'Counselling'|'Clinical'|'Organisational'|NULL
  year integer,                        -- 1 or 2
  selected_papers jsonb,               -- array of course codes for current TEE
  plan_tier text default 'free' check (plan_tier in ('free', 'pass')),
  free_credits_used integer default 0, -- counts against the 5 free AI answer credits
  referral_code text unique default substr(md5(random()::text), 1, 8),
  referred_by text,                    -- referral_code of referrer
  onboarding_complete boolean default false,
  urna_opt_in boolean default false,  -- user expressed interest in URNA career platform
  last_seen_at timestamptz,
  created_at timestamptz default now()
);

-- Subscriptions
create table subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  plan_tier text not null check (plan_tier in ('free', 'pass')),
  billing_cycle text check (billing_cycle in ('monthly', 'semester')),
  status text default 'active' check (status in ('active', 'cancelled', 'expired')),
  razorpay_subscription_id text,
  razorpay_payment_id text,
  start_date timestamptz,
  end_date timestamptz,
  payment_history jsonb default '[]'::jsonb,
  created_at timestamptz default now()
);

-- User question progress
create table user_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  question_id uuid references questions(id) on delete cascade,
  status text check (status in ('reviewed', 'bookmarked', 'skipped')),
  reviewed_at timestamptz default now(),
  unique(user_id, question_id, status)
);

create index if not exists user_progress_user_question_idx
  on user_progress (user_id, question_id);

-- Page events for first-party funnel visibility across anonymous and signed-in visitors
create table page_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete set null,
  anonymous_id text,
  path text not null,
  url text,
  referrer text,
  user_agent text,
  created_at timestamptz not null default now()
);

create index if not exists page_events_path_created_idx
  on page_events (path, created_at desc);

create index if not exists page_events_user_created_idx
  on page_events (user_id, created_at desc);

create index if not exists page_events_anonymous_created_idx
  on page_events (anonymous_id, created_at desc);

-- Distinct user question/answer views used by admin conversion reporting
create table user_question_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  question_id uuid references questions(id) on delete cascade,
  course_code text references courses(code) on delete set null,
  event_type text not null check (event_type in ('question_viewed', 'answer_viewed')),
  access_state text not null check (access_state in ('free', 'paid')),
  plan_tier text,
  created_at timestamptz not null default now(),
  unique (user_id, question_id, event_type, access_state)
);

create index if not exists user_question_events_user_idx
  on user_question_events (user_id, event_type, access_state);

create index if not exists user_question_events_course_idx
  on user_question_events (course_code, event_type, created_at desc);

-- User concept tree progress
create table concept_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  concept_id uuid references concept_tree(id) on delete cascade,
  status text check (status in ('exploring', 'learning', 'mastered')),
  updated_at timestamptz default now(),
  unique(user_id, concept_id)
);

-- Study plans
create table study_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  courses jsonb not null,
  hours_per_day numeric not null,
  exam_date date not null,
  plan_data jsonb not null,            -- full day-by-day schedule
  created_at timestamptz default now()
);

-- Assignments (one per course per year, essay format like TEE)
create table assignments (
  id uuid primary key default gen_random_uuid(),
  course_id uuid references courses(id) on delete cascade,
  year integer not null,
  questions jsonb not null,              -- array of {question_text, marks, block_ref, chapter_ref, page_ref}
  source_url text,                       -- URL of the original IGNOU assignment PDF
  created_at timestamptz default now(),
  unique(course_id, year)
);

-- Assignment answers (generated per user per assignment question)
create table assignment_answers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  assignment_id uuid references assignments(id) on delete cascade,
  question_index integer not null,       -- which question in assignments.questions array
  answer_type text check (answer_type in ('reference', 'generated', 'tailored')),
  -- reference: textbook block/chapter/page pointer (Pass tier)
  -- generated: full AI answer in IGNOU format (Pro tier)
  -- tailored: personalised to student style (future tier)
  content jsonb not null,                -- {answer_text, citations: [{block, chapter, section, page}], word_count}
  style_guide text,                      -- student's writing style notes (tailored tier only)
  created_at timestamptz default now(),
  unique(user_id, assignment_id, question_index)
);

-- Content flags (user-reported errors in AI answers)
create table content_flags (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete set null,
  question_id uuid references questions(id) on delete cascade,
  flag_type text check (flag_type in ('error', 'unclear', 'incomplete')),
  description text,
  status text default 'open' check (status in ('open', 'resolved')),
  resolved_at timestamptz,
  created_at timestamptz default now()
);

-- In-app support and admin inbox
create table support_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete set null,
  email text not null,
  phone text,
  category text not null check (category in ('payment', 'content', 'access', 'account', 'feature', 'other')),
  subject text not null,
  message text not null,
  status text not null default 'open' check (status in ('open', 'in_progress', 'resolved')),
  priority text not null default 'normal' check (priority in ('low', 'normal', 'high')),
  admin_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists support_requests_status_created_idx
  on support_requests (status, created_at desc);

create index if not exists support_requests_user_created_idx
  on support_requests (user_id, created_at desc);

-- RLS POLICIES

-- Users can read/write only their own row
alter table users enable row level security;
create policy "users_own_row" on users using (auth.uid() = id);

-- Authenticated users can read all courses and questions
alter table courses enable row level security;
create policy "courses_read_all" on courses for select using (auth.role() = 'authenticated');

alter table questions enable row level security;
create policy "questions_read_all" on questions for select using (auth.role() = 'authenticated');

-- User progress: own rows only
alter table user_progress enable row level security;
create policy "progress_own" on user_progress using (auth.uid() = user_id);

-- Entitlements: own rows only
alter table user_entitlements enable row level security;
create policy "entitlements_own_read" on user_entitlements for select using (auth.uid() = user_id);
create policy "entitlements_own_insert" on user_entitlements for insert with check (auth.uid() = user_id);
create policy "entitlements_own_update" on user_entitlements for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Referrals: participants can read; referred user can create their own pending referral
alter table referrals enable row level security;
create policy "referrals_participant_read" on referrals for select using (auth.uid() = referrer_user_id or auth.uid() = referred_user_id);
create policy "referrals_referred_insert" on referrals for insert with check (auth.uid() = referred_user_id);

-- Subscriptions: own rows only
alter table subscriptions enable row level security;
create policy "subscriptions_own" on subscriptions using (auth.uid() = user_id);

-- Concept progress: own rows only
alter table concept_progress enable row level security;
create policy "concept_progress_own" on concept_progress using (auth.uid() = user_id);

-- Study plans: own rows only
alter table study_plans enable row level security;
create policy "study_plans_own" on study_plans using (auth.uid() = user_id);

-- Content flags: authenticated users can create, read only own
alter table content_flags enable row level security;
create policy "content_flags_insert" on content_flags for insert with check (auth.role() = 'authenticated');
create policy "content_flags_own" on content_flags for select using (auth.uid() = user_id);

-- User question events: own rows only
alter table user_question_events enable row level security;
create policy "question_events_own_read" on user_question_events for select using (auth.uid() = user_id);
create policy "question_events_own_insert" on user_question_events for insert with check (auth.uid() = user_id);
create policy "question_events_own_update" on user_question_events for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Support requests: own rows only
alter table support_requests enable row level security;
create policy "support_requests_own_read" on support_requests for select using (auth.uid() = user_id);
create policy "support_requests_own_insert" on support_requests for insert with check (auth.uid() = user_id);

-- Topic clusters: read-only for authenticated
alter table topic_clusters enable row level security;
create policy "topic_clusters_read_all" on topic_clusters for select using (auth.role() = 'authenticated');

-- Concept tree: read-only for authenticated
alter table concept_tree enable row level security;
create policy "concept_tree_read_all" on concept_tree for select using (auth.role() = 'authenticated');

-- Assignments: read-only for authenticated
alter table assignments enable row level security;
create policy "assignments_read_all" on assignments for select using (auth.role() = 'authenticated');

-- Assignment answers: own rows only
alter table assignment_answers enable row level security;
create policy "assignment_answers_own" on assignment_answers using (auth.uid() = user_id);


-- TRIGGERS

-- Supabase trigger to auto-insert into public.users on new auth.users row
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, email, phone, auth_provider, referred_by)
  values (
    new.id,
    new.email,
    nullif(new.raw_user_meta_data->>'phone', ''),
    new.raw_app_meta_data->>'provider',
    nullif(new.raw_user_meta_data->>'referred_by', '')
  );
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- ============================================================
-- Mock Test Attempts (P4 – Mock Test mode)
-- ============================================================
create table if not exists mock_test_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  course_id uuid references courses(id) on delete cascade,
  questions jsonb not null,            -- array of {question_id, question_text, section, marks}
  answers jsonb not null default '[]'::jsonb,  -- array of {question_id, answer_text, self_grade}
  completed_at timestamptz,
  time_taken_seconds integer,
  created_at timestamptz default now()
);
alter table mock_test_attempts enable row level security;
create policy "mock_test_attempts_own" on mock_test_attempts
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index if not exists mock_test_attempts_user_idx
  on mock_test_attempts (user_id);
create index if not exists mock_test_attempts_course_idx
  on mock_test_attempts (course_id);
