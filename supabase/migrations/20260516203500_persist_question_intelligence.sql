alter table questions
  add column if not exists repeat_family_key text,
  add column if not exists repeat_family_label text,
  add column if not exists study_hook_key text,
  add column if not exists study_hook_label text,
  add column if not exists repeat_algo_version text,
  add column if not exists repeat_intelligence_updated_at timestamptz,
  add column if not exists repeat_intelligence_reviewed_at timestamptz;

create index if not exists questions_course_repeat_family_idx
  on questions (course_id, repeat_family_key);

create index if not exists questions_course_study_hook_idx
  on questions (course_id, study_hook_key);

comment on column questions.repeat_family_key is
  'Exact or near-exact semantic repeat family key used to group question variations.';

comment on column questions.repeat_family_label is
  'Human-readable label for repeat_family_key at the time of backfill.';

comment on column questions.study_hook_key is
  'Broader preparation hook key used for high-yield study zones.';

comment on column questions.study_hook_label is
  'Human-readable label for study_hook_key at the time of backfill.';

comment on column questions.repeat_algo_version is
  'Version of the Topper101 repeat-intelligence algorithm used for the persisted keys.';

comment on column questions.repeat_intelligence_updated_at is
  'Timestamp when repeat-family and study-hook keys were last computed.';

comment on column questions.repeat_intelligence_reviewed_at is
  'Optional human review timestamp for persisted repeat intelligence.';
