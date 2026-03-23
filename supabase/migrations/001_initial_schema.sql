-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Courses
create table if not exists courses (
  id uuid primary key default uuid_generate_v4(),
  code text not null unique,
  name text not null,
  year int not null,
  stream text not null check (stream in ('core','counselling','clinical','organisational','common')),
  created_at timestamptz default now()
);

-- Questions
create table if not exists questions (
  id uuid primary key default uuid_generate_v4(),
  course_id uuid references courses(id) on delete cascade,
  question_text text not null,
  question_type text not null check (question_type in ('long','medium','short')),
  marks int not null,
  model_answer text,
  answer_generated_by text check (answer_generated_by in ('deepseek','gpt4o','human')),
  frequency_tag text check (frequency_tag in ('high','medium','low')),
  last_appeared date,
  is_published boolean default false,
  created_at timestamptz default now()
);

-- User profiles
create table if not exists user_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  enrolled_courses text[] default '{}',
  exam_date date,
  subscription_tier text not null default 'free' check (subscription_tier in ('free','exam_pass','full_archive')),
  created_at timestamptz default now()
);

-- User progress
create table if not exists user_progress (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references user_profiles(id) on delete cascade,
  question_id uuid references questions(id) on delete cascade,
  viewed_at timestamptz default now(),
  is_bookmarked boolean default false,
  unique(user_id, question_id)
);

-- RLS policies
alter table user_profiles enable row level security;
alter table user_progress enable row level security;

create policy "Users can view own profile" on user_profiles for select using (auth.uid() = id);
create policy "Users can update own profile" on user_profiles for update using (auth.uid() = id);
create policy "Users can insert own profile" on user_profiles for insert with check (auth.uid() = id);

create policy "Users can view own progress" on user_progress for select using (auth.uid() = user_id);
create policy "Users can insert own progress" on user_progress for insert with check (auth.uid() = user_id);
create policy "Users can update own progress" on user_progress for update using (auth.uid() = user_id);

-- Seed courses
insert into courses (code, name, year, stream) values
  ('MPC-001', 'Cognitive Psychology', 1, 'core'),
  ('MPC-002', 'Life Span Psychology', 1, 'core'),
  ('MPC-003', 'Personality: Theories and Assessment', 1, 'core'),
  ('MPC-004', 'Advanced Social Psychology', 1, 'core'),
  ('MPC-005', 'Research Methods in Psychology', 1, 'core'),
  ('MPC-006', 'Statistics in Psychology', 1, 'core'),
  ('MPCE-011', 'Psychopathology', 2, 'counselling'),
  ('MPCE-012', 'Theories and Practice of Counselling', 2, 'counselling'),
  ('MPCE-013', 'Psychotherapeutic Methods', 2, 'counselling'),
  ('MPCE-021', 'Abnormal Psychology', 2, 'clinical'),
  ('MPCE-022', 'Assessment in Clinical Psychology', 2, 'clinical'),
  ('MPCE-023', 'Interventions in Clinical Psychology', 2, 'clinical'),
  ('MPCE-031', 'Organisational Behaviour', 2, 'organisational'),
  ('MPCE-032', 'Human Resource Development', 2, 'organisational'),
  ('MPCE-033', 'Counselling and Guidance', 2, 'organisational'),
  ('MPCE-046', 'Applications of Social Psychology', 2, 'common')
on conflict (code) do nothing;
