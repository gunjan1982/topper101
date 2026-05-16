-- Migration: Add entitlements + referrals system
-- Safe to run multiple times (all statements are idempotent).
-- Run this in the Supabase dashboard SQL editor: https://supabase.com/dashboard/project/eggvjlxpbujxkeatemxa/sql

-- ─── 1. Users table: add referral columns if missing ────────────────────────

alter table users
  add column if not exists referral_code text unique default substr(md5(random()::text), 1, 8);

alter table users
  add column if not exists referred_by text;

-- ─── 2. User entitlements table ─────────────────────────────────────────────

create table if not exists user_entitlements (
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

-- ─── 3. Referrals table ──────────────────────────────────────────────────────

create table if not exists referrals (
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

-- ─── 4. RLS policies ─────────────────────────────────────────────────────────

alter table user_entitlements enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where tablename = 'user_entitlements' and policyname = 'entitlements_own_read'
  ) then
    create policy "entitlements_own_read" on user_entitlements
      for select using (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where tablename = 'user_entitlements' and policyname = 'entitlements_own_insert'
  ) then
    create policy "entitlements_own_insert" on user_entitlements
      for insert with check (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where tablename = 'user_entitlements' and policyname = 'entitlements_own_update'
  ) then
    create policy "entitlements_own_update" on user_entitlements
      for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
  end if;
end $$;

alter table referrals enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where tablename = 'referrals' and policyname = 'referrals_participant_read'
  ) then
    create policy "referrals_participant_read" on referrals
      for select using (auth.uid() = referrer_user_id or auth.uid() = referred_user_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where tablename = 'referrals' and policyname = 'referrals_referred_insert'
  ) then
    create policy "referrals_referred_insert" on referrals
      for insert with check (auth.uid() = referred_user_id);
  end if;
end $$;

-- ─── 5. Trigger: auto-populate public.users on signup ─────────────────────

create or replace function handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, email, auth_provider, referred_by)
  values (
    new.id,
    new.email,
    new.raw_app_meta_data->>'provider',
    nullif(new.raw_user_meta_data->>'referred_by', '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

-- Drop and recreate trigger (idempotent)
drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();
