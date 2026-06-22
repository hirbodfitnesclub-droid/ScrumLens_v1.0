-- 0002_rls.sql
-- Enable Row Level Security (RLS) and define access control rules

-- List of all tables to enable RLS on
alter table public.people enable row level security;
alter table public.teams enable row level security;
alter table public.team_members enable row level security;
alter table public.projects enable row level security;
alter table public.labels enable row level security;
alter table public.modules enable row level security;
alter table public.cycles enable row level security;
alter table public.tasks enable row level security;
alter table public.task_assignees enable row level security;
alter table public.task_subscribers enable row level security;
alter table public.task_labels enable row level security;
alter table public.task_modules enable row level security;
alter table public.task_cycles enable row level security;
alter table public.comments enable row level security;
alter table public.imports enable row level security;
alter table public.task_changes enable row level security;
alter table public.state_group_map enable row level security;
alter table public.work_categories enable row level security;
alter table public.allocations enable row level security;
alter table public.allocation_owners enable row level security;
alter table public.report_templates enable row level security;

-- POLICY CREATOR HELPER FUNCTION-LIKE SCRIPTS (Since RLS requires user_id ownership match)
-- PEOPLE
create policy "User can manage their own people" on public.people
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- TEAMS
create policy "User can manage their own teams" on public.teams
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- TEAM MEMBERS
create policy "User can manage their own team members" on public.team_members
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- PROJECTS
create policy "User can manage their own projects" on public.projects
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- LABELS
create policy "User can manage their own labels" on public.labels
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- MODULES
create policy "User can manage their own modules" on public.modules
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- CYCLES
create policy "User can manage their own cycles" on public.cycles
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- TASKS
create policy "User can manage their own tasks" on public.tasks
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- TASK ASSIGNEES
create policy "User can manage their own task assignees" on public.task_assignees
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- TASK SUBSCRIBERS
create policy "User can manage their own task subscribers" on public.task_subscribers
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- TASK LABELS
create policy "User can manage their own task labels" on public.task_labels
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- TASK MODULES
create policy "User can manage their own task modules" on public.task_modules
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- TASK CYCLES
create policy "User can manage their own task cycles" on public.task_cycles
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- COMMENTS
create policy "User can manage their own task comments" on public.comments
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- IMPORTS
create policy "User can manage their own imports logs" on public.imports
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- TASK CHANGES
create policy "User can manage their own task changes log" on public.task_changes
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- STATE GROUP MAP
create policy "User can manage their own state mappings" on public.state_group_map
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- WORK CATEGORIES
create policy "User can manage their own work categories" on public.work_categories
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ALLOCATIONS
create policy "User can manage their own allocations hours" on public.allocations
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ALLOCATION OWNERS
create policy "User can manage their own allocation owners" on public.allocation_owners
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- REPORT TEMPLATES
create policy "User can manage their own custom report templates" on public.report_templates
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
