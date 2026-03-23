-- Allow any authenticated user to read published questions and courses
alter table questions enable row level security;
alter table courses enable row level security;

create policy "Anyone can read published questions"
  on questions for select
  using (is_published = true);

create policy "Anyone can read courses"
  on courses for select
  using (true);
