alter table user_progress
  drop constraint if exists user_progress_user_id_question_id_key;

alter table user_progress
  add constraint user_progress_user_id_question_id_status_key
  unique (user_id, question_id, status);

create index if not exists user_progress_user_question_idx
  on user_progress (user_id, question_id);
