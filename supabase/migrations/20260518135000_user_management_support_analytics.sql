alter table users
  add column if not exists phone text,
  add column if not exists last_seen_at timestamptz;

create table if not exists page_events (
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

create table if not exists user_question_events (
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

alter table user_question_events enable row level security;

drop policy if exists "question_events_own_read" on user_question_events;
create policy "question_events_own_read" on user_question_events
  for select using (auth.uid() = user_id);

drop policy if exists "question_events_own_insert" on user_question_events;
create policy "question_events_own_insert" on user_question_events
  for insert with check (auth.uid() = user_id);

drop policy if exists "question_events_own_update" on user_question_events;
create policy "question_events_own_update" on user_question_events
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table if not exists support_requests (
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

alter table support_requests enable row level security;

drop policy if exists "support_requests_own_read" on support_requests;
create policy "support_requests_own_read" on support_requests
  for select using (auth.uid() = user_id);

drop policy if exists "support_requests_own_insert" on support_requests;
create policy "support_requests_own_insert" on support_requests
  for insert with check (auth.uid() = user_id);

drop policy if exists "support_requests_own_update" on support_requests;

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
