-- ============================================================
-- Topper101 — Monthly Free Credit Reset
-- Run this SQL in the Supabase SQL Editor (once).
--
-- IMPORTANT: pg_cron must be enabled in your Supabase project.
-- Enable it at: Supabase Dashboard → Database → Extensions → pg_cron
-- ============================================================

-- 1. Enable the pg_cron extension (if not already enabled)
create extension if not exists pg_cron;

-- 2. Schedule the reset job
--    Runs at 00:00 UTC on the 1st of every month.
--    Only resets free-tier users; paid users are not affected.
select cron.schedule(
  'reset-free-credits',          -- job name (unique identifier)
  '0 0 1 * *',                   -- cron expression: midnight on the 1st
  $$
    update public.users
    set free_credits_used = 0
    where plan_tier = 'free';
  $$
);

-- 3. Verify the job was created
-- select * from cron.job where jobname = 'reset-free-credits';

-- ============================================================
-- To remove this job later (if needed):
-- select cron.unschedule('reset-free-credits');
-- ============================================================
