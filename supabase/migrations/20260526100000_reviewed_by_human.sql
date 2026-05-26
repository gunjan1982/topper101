alter table questions
  add column if not exists reviewed_by_human boolean not null default false;
