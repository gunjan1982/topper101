-- Migration: Add relationship columns and indexes to concept_tree table for pipeline linking
alter table concept_tree add column if not exists course_primary_code text references courses(code) on delete set null;
alter table concept_tree add column if not exists topic_cluster_id uuid;
alter table concept_tree add column if not exists linked_question_ids jsonb default '[]'::jsonb;

create index if not exists concept_tree_course_idx on concept_tree (course_primary_code);
create index if not exists concept_tree_cluster_idx on concept_tree (topic_cluster_id);
