-- ================================================================
-- LHC Operating System — Database Schema
-- Run this entire file in your Supabase SQL editor
-- ================================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ── DEPARTMENTS ─────────────────────────────────────────────────
create table public.departments (
  id uuid primary key default uuid_generate_v4(),
  name text not null unique,
  color text not null default '#FFCB1A',
  created_at timestamptz default now()
);

insert into public.departments (name, color) values
  ('Management',            '#1A1A1A'),
  ('Technical Office',      '#185FA5'),
  ('Business Development',  '#FFCB1A'),
  ('Finance & Accounting',  '#0F6E56'),
  ('Procurement',           '#854F0B'),
  ('Site / Operations',     '#993C1D'),
  ('HR / Admin',            '#534AB7');

-- ── PROFILES (extends Supabase auth.users) ──────────────────────
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  email text not null unique,
  role text not null default 'employee' check (role in ('admin', 'manager', 'employee')),
  department_id uuid references public.departments(id),
  title text,
  phone text,
  avatar_url text,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ── ANNOUNCEMENTS ────────────────────────────────────────────────
create table public.announcements (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  body text not null,
  author_id uuid not null references public.profiles(id),
  audience text not null default 'all' check (audience in ('all', 'department')),
  department_id uuid references public.departments(id),
  is_pinned boolean default false,
  email_sent boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table public.announcement_reads (
  announcement_id uuid references public.announcements(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete cascade,
  read_at timestamptz default now(),
  primary key (announcement_id, user_id)
);

-- ── PROJECTS ────────────────────────────────────────────────────
create table public.projects (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  description text,
  client text,
  department_id uuid references public.departments(id),
  owner_id uuid references public.profiles(id),
  status text not null default 'active' check (status in ('planning', 'active', 'on_hold', 'completed', 'cancelled')),
  priority text not null default 'medium' check (priority in ('low', 'medium', 'high', 'critical')),
  start_date date,
  deadline date,
  progress integer default 0 check (progress >= 0 and progress <= 100),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Project members (many-to-many)
create table public.project_members (
  project_id uuid references public.projects(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete cascade,
  role text default 'member' check (role in ('lead', 'member')),
  joined_at timestamptz default now(),
  primary key (project_id, user_id)
);

-- ── TASKS ───────────────────────────────────────────────────────
create table public.tasks (
  id uuid primary key default uuid_generate_v4(),
  project_id uuid not null references public.projects(id) on delete cascade,
  title text not null,
  description text,
  status text not null default 'todo' check (status in ('todo', 'in_progress', 'review', 'done')),
  priority text not null default 'medium' check (priority in ('low', 'medium', 'high', 'critical')),
  assignee_id uuid references public.profiles(id),
  department_id uuid references public.departments(id),
  deadline date,
  estimated_hours numeric(5,1),
  actual_hours numeric(5,1),
  sort_order integer default 0,
  created_by uuid references public.profiles(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ── INVITATIONS ─────────────────────────────────────────────────
create table public.invitations (
  id uuid primary key default uuid_generate_v4(),
  email text not null,
  full_name text not null,
  role text not null default 'employee',
  department_id uuid references public.departments(id),
  title text,
  token text not null unique default encode(gen_random_bytes(32), 'hex'),
  invited_by uuid references public.profiles(id),
  accepted_at timestamptz,
  expires_at timestamptz default now() + interval '7 days',
  created_at timestamptz default now()
);

-- ── NOTIFICATIONS ────────────────────────────────────────────────
create table public.notifications (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  type text not null,
  title text not null,
  body text,
  link text,
  read boolean default false,
  created_at timestamptz default now()
);

-- ── ROW LEVEL SECURITY ──────────────────────────────────────────
alter table public.profiles enable row level security;
alter table public.departments enable row level security;
alter table public.announcements enable row level security;
alter table public.announcement_reads enable row level security;
alter table public.projects enable row level security;
alter table public.project_members enable row level security;
alter table public.tasks enable row level security;
alter table public.invitations enable row level security;
alter table public.notifications enable row level security;

-- Profiles: authenticated users can read all, edit own
create policy "profiles_select" on public.profiles for select to authenticated using (true);
create policy "profiles_insert" on public.profiles for insert to authenticated with check (auth.uid() = id);
create policy "profiles_update" on public.profiles for update to authenticated using (auth.uid() = id);

-- Departments: all authenticated can read
create policy "departments_select" on public.departments for select to authenticated using (true);

-- Announcements: all authenticated can read
create policy "announcements_select" on public.announcements for select to authenticated using (true);
create policy "announcements_insert" on public.announcements for insert to authenticated with check (auth.uid() = author_id);
create policy "announcements_update" on public.announcements for update to authenticated using (auth.uid() = author_id);

-- Reads
create policy "reads_select" on public.announcement_reads for select to authenticated using (auth.uid() = user_id);
create policy "reads_insert" on public.announcement_reads for insert to authenticated with check (auth.uid() = user_id);

-- Projects: all authenticated can read
create policy "projects_select" on public.projects for select to authenticated using (true);
create policy "projects_insert" on public.projects for insert to authenticated with check (true);
create policy "projects_update" on public.projects for update to authenticated using (true);

-- Project members
create policy "project_members_select" on public.project_members for select to authenticated using (true);
create policy "project_members_insert" on public.project_members for insert to authenticated with check (true);
create policy "project_members_delete" on public.project_members for delete to authenticated using (true);

-- Tasks
create policy "tasks_select" on public.tasks for select to authenticated using (true);
create policy "tasks_insert" on public.tasks for insert to authenticated with check (true);
create policy "tasks_update" on public.tasks for update to authenticated using (true);
create policy "tasks_delete" on public.tasks for delete to authenticated using (true);

-- Notifications: own only
create policy "notifications_select" on public.notifications for select to authenticated using (auth.uid() = user_id);
create policy "notifications_update" on public.notifications for update to authenticated using (auth.uid() = user_id);

-- Invitations: admins manage
create policy "invitations_select" on public.invitations for select to authenticated using (true);

-- ── AUTO-UPDATE TIMESTAMPS ──────────────────────────────────────
create or replace function public.update_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;

create trigger trg_profiles_updated before update on public.profiles
  for each row execute function public.update_updated_at();
create trigger trg_announcements_updated before update on public.announcements
  for each row execute function public.update_updated_at();
create trigger trg_projects_updated before update on public.projects
  for each row execute function public.update_updated_at();
create trigger trg_tasks_updated before update on public.tasks
  for each row execute function public.update_updated_at();

-- ── AUTO-CALCULATE PROJECT PROGRESS from tasks ───────────────────
create or replace function public.recalculate_project_progress()
returns trigger language plpgsql as $$
declare
  total_tasks integer;
  done_tasks integer;
  new_progress integer;
begin
  select count(*) into total_tasks from public.tasks where project_id = coalesce(new.project_id, old.project_id);
  select count(*) into done_tasks from public.tasks where project_id = coalesce(new.project_id, old.project_id) and status = 'done';
  if total_tasks = 0 then
    new_progress := 0;
  else
    new_progress := round((done_tasks::numeric / total_tasks::numeric) * 100);
  end if;
  update public.projects set progress = new_progress where id = coalesce(new.project_id, old.project_id);
  return new;
end; $$;

create trigger trg_task_progress after insert or update or delete on public.tasks
  for each row execute function public.recalculate_project_progress();
