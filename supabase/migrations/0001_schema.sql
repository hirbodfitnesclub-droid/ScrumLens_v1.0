-- 0001_schema.sql
-- Database schema for ScrumLens

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- PEOPLE TABLE
create table if not exists public.people (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid(),
  full_name text not null,
  normalized_name text not null,
  aliases text[] default '{}',
  avatar_color text,
  role_title text,
  is_active boolean default true,
  created_at timestamptz default now(),
  constraint people_user_id_normalized_name_unique unique (user_id, normalized_name)
);

-- TEAMS TABLE
create table if not exists public.teams (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid(),
  name text not null,
  color text,
  description text,
  created_at timestamptz default now(),
  constraint teams_user_id_name_unique unique (user_id, name)
);

-- TEAM MEMBERS (Many-to-Many between people and teams)
create table if not exists public.team_members (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid(),
  team_id uuid references public.teams(id) on delete cascade,
  person_id uuid references public.people(id) on delete cascade,
  constraint team_members_team_id_person_id_unique unique (team_id, person_id)
);

-- PROJECTS TABLE
create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid(),
  plane_identifier text not null,
  name text not null,
  color text,
  status text default 'active',
  created_at timestamptz default now(),
  constraint projects_user_id_plane_identifier_unique unique (user_id, plane_identifier)
);

-- LABELS TABLE
create table if not exists public.labels (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid(),
  name text not null,
  color text,
  constraint labels_user_id_name_unique unique (user_id, name)
);

-- MODULES TABLE
create table if not exists public.modules (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid(),
  name text not null,
  project_id uuid references public.projects(id) on delete cascade,
  constraint modules_user_id_project_id_name_unique unique (user_id, project_id, name)
);

-- CYCLES TABLE
create table if not exists public.cycles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid(),
  name text not null,
  project_id uuid references public.projects(id) on delete cascade,
  start_date date,
  end_date date
);

-- CENTRAL TASKS TABLE
create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid(),
  project_id uuid references public.projects(id) on delete cascade,
  plane_identifier text not null,
  sequence_id integer,
  parent_identifier text,
  name text,
  state_name text,
  state_group text, -- 'backlog' | 'unstarted' | 'started' | 'completed' | 'cancelled'
  priority text default 'none',
  created_by_name text,
  start_date date,
  target_date date,
  completed_at timestamptz,
  plane_created_at timestamptz,
  plane_updated_at timestamptz,
  archived_at timestamptz,
  estimate numeric,
  is_draft boolean default false,
  
  -- Sync management
  sync_status text default 'active', -- 'active' | 'deleted'
  content_hash text,
  first_seen_import uuid,
  last_seen_import uuid,
  first_seen_at timestamptz default now(),
  last_seen_at timestamptz default now(),
  raw jsonb,
  constraint tasks_user_id_plane_identifier_unique unique (user_id, plane_identifier)
);

-- TASK ASSIGNEES
create table if not exists public.task_assignees (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid(),
  task_id uuid references public.tasks(id) on delete cascade,
  person_id uuid references public.people(id) on delete cascade,
  constraint task_assignees_task_id_person_id_unique unique (task_id, person_id)
);

-- TASK SUBSCRIBERS
create table if not exists public.task_subscribers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid(),
  task_id uuid references public.tasks(id) on delete cascade,
  person_id uuid references public.people(id) on delete cascade,
  constraint task_subscribers_task_id_person_id_unique unique (task_id, person_id)
);

-- TASK LABELS
create table if not exists public.task_labels (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid(),
  task_id uuid references public.tasks(id) on delete cascade,
  label_id uuid references public.labels(id) on delete cascade,
  constraint task_labels_task_id_label_id_unique unique (task_id, label_id)
);

-- TASK MODULES
create table if not exists public.task_modules (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid(),
  task_id uuid references public.tasks(id) on delete cascade,
  module_id uuid references public.modules(id) on delete cascade,
  constraint task_modules_task_id_module_id_unique unique (task_id, module_id)
);

-- TASK CYCLES
create table if not exists public.task_cycles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid(),
  task_id uuid references public.tasks(id) on delete cascade,
  cycle_id uuid references public.cycles(id) on delete cascade,
  constraint task_cycles_task_id_cycle_id_unique unique (task_id, cycle_id)
);

-- COMMENTS TABLE
create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid(),
  task_id uuid references public.tasks(id) on delete cascade,
  author_name text,
  person_id uuid references public.people(id) on delete set null,
  body text,
  plane_created_at timestamptz,
  content_hash text,
  constraint comments_user_id_task_id_content_hash_unique unique (user_id, task_id, content_hash)
);

-- IMPORTS HISTORIES
create table if not exists public.imports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid(),
  file_name text,
  imported_at timestamptz default now(),
  row_count integer,
  summary jsonb -- {added, updated, removed, restored, unchanged}
);

-- TASK CHANGES
create table if not exists public.task_changes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid(),
  import_id uuid references public.imports(id) on delete cascade,
  task_id uuid references public.tasks(id) on delete cascade,
  plane_identifier text,
  change_type text, -- 'added' | 'updated' | 'removed' | 'restored'
  field_diffs jsonb -- {field: {from, to}}
);

-- EDITABLE STATE GROUP MAP
create table if not exists public.state_group_map (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid(),
  state_name text not null,
  state_group text not null, -- backlog/unstarted/started/completed/cancelled
  constraint state_group_map_user_id_state_name_unique unique (user_id, state_name)
);

-- WORK CATEGORIES
create table if not exists public.work_categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid(),
  name text not null,
  constraint work_categories_user_id_name_unique unique (user_id, name)
);

-- AGREED ALLOCATIONS HOURS
create table if not exists public.allocations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid(),
  project_id uuid references public.projects(id) on delete cascade,
  category_id uuid references public.work_categories(id) on delete cascade,
  agreed_hours numeric not null,
  period_month text not null, -- 'YYYY-MM' format
  notes text,
  created_at timestamptz default now(),
  constraint allocations_user_id_project_category_period_unique unique (user_id, project_id, category_id, period_month)
);

-- ALLOCATION OWNERS
create table if not exists public.allocation_owners (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid(),
  allocation_id uuid references public.allocations(id) on delete cascade,
  person_id uuid references public.people(id) on delete cascade,
  team_id uuid references public.teams(id) on delete cascade,
  constraint allocation_owners_only_one check (
    (person_id is not null and team_id is null) or 
    (person_id is null and team_id is not null) or
    (person_id is not null and team_id is not null)
  )
);

-- REPORT TEMPLATES
create table if not exists public.report_templates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid(),
  name text not null,
  type text not null, -- 'weekly'|'monthly'|'custom'
  config jsonb, -- {sections:[...], filters:{...}, audience: 'finance'|'po'|'internal'}
  created_at timestamptz default now()
);

-- Performance indices
create index if not exists idx_tasks_user_id_plane_identifier on public.tasks (user_id, plane_identifier);
create index if not exists idx_tasks_project_id on public.tasks (project_id);
create index if not exists idx_comments_task_id on public.comments (task_id);
create index if not exists idx_task_assignees_task_id on public.task_assignees (task_id);
create index if not exists idx_task_changes_task_id on public.task_changes (task_id);
