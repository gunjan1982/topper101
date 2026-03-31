-- Migration 003: Add probability, topic, free_course columns
alter table questions add column if not exists probability int check (probability between 1 and 100);
alter table questions add column if not exists topic text;
alter table user_profiles add column if not exists free_course text;
