-- ================================================================
-- LHC OS Phase 2: Site Reports + Document Vault
-- ================================================================

-- ── SITE REPORTS ─────────────────────────────────────────────────
create table public.site_reports (
  id uuid primary key default uuid_generate_v4(),
  project_id uuid not null references public.projects(id) on delete cascade,
  submitted_by uuid not null references public.profiles(id),
  report_date date not null default current_date,
  report_type text not null default 'daily' check (report_type in ('daily', 'weekly')),
  -- Manpower
  total_manpower integer default 0,
  manpower_breakdown jsonb default '[]',
  -- Work done
  work_completed text,
  work_planned text,
  -- Materials
  materials_received text,
  materials_pending text,
  -- Issues
  issues text,
  blockers text,
  -- Weather (relevant for construction)
  weather text,
  -- Status
  status text not null default 'submitted' check (status in ('submitted', 'reviewed')),
  reviewed_by uuid references public.profiles(id),
  reviewed_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Site report photos
create table public.site_report_photos (
  id uuid primary key default uuid_generate_v4(),
  report_id uuid not null references public.site_reports(id) on delete cascade,
  storage_path text not null,
  caption text,
  uploaded_at timestamptz default now()
);

-- ── DOCUMENT VAULT ───────────────────────────────────────────────
create table public.documents (
  id uuid primary key default uuid_generate_v4(),
  project_id uuid not null references public.projects(id) on delete cascade,
  task_id uuid references public.tasks(id) on delete set null,
  name text not null,
  description text,
  category text not null default 'general' check (category in (
    'drawing', 'contract', 'boq', 'submittal', 'rfi', 'warranty',
    'inspection', 'report', 'photo', 'other'
  )),
  file_name text not null,
  file_size bigint,
  file_type text,
  storage_path text not null,
  version integer not null default 1,
  status text not null default 'pending' check (status in ('pending', 'approved', 'revision_requested', 'sent_to_client')),
  uploaded_by uuid not null references public.profiles(id),
  approved_by uuid references public.profiles(id),
  approved_at timestamptz,
  revision_notes text,
  sent_to_client_at timestamptz,
  sent_to_client_by uuid references public.profiles(id),
  client_email text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Document version history
create table public.document_versions (
  id uuid primary key default uuid_generate_v4(),
  document_id uuid not null references public.documents(id) on delete cascade,
  version integer not null,
  storage_path text not null,
  uploaded_by uuid references public.profiles(id),
  notes text,
  created_at timestamptz default now()
);

-- ── RLS ──────────────────────────────────────────────────────────
alter table public.site_reports enable row level security;
alter table public.site_report_photos enable row level security;
alter table public.documents enable row level security;
alter table public.document_versions enable row level security;

-- Site reports: management sees all, others see their project's reports
create policy "site_reports_select" on public.site_reports for select to authenticated
  using (public.is_management() OR submitted_by = auth.uid() OR
    EXISTS (SELECT 1 FROM public.projects p WHERE p.id = project_id AND (p.department_id = public.my_department_id() OR p.owner_id = auth.uid())));
create policy "site_reports_insert" on public.site_reports for insert to authenticated
  with check (submitted_by = auth.uid());
create policy "site_reports_update" on public.site_reports for update to authenticated
  using (public.is_management() OR submitted_by = auth.uid());

-- Photos
create policy "photos_select" on public.site_report_photos for select to authenticated using (true);
create policy "photos_insert" on public.site_report_photos for insert to authenticated with check (true);

-- Documents: management sees all, others see their project docs
create policy "docs_select" on public.documents for select to authenticated
  using (public.is_management() OR uploaded_by = auth.uid() OR
    EXISTS (SELECT 1 FROM public.projects p WHERE p.id = project_id AND (p.department_id = public.my_department_id() OR p.owner_id = auth.uid())));
create policy "docs_insert" on public.documents for insert to authenticated with check (true);
create policy "docs_update" on public.documents for update to authenticated
  using (public.is_management() OR uploaded_by = auth.uid());

-- Document versions
create policy "doc_versions_select" on public.document_versions for select to authenticated using (true);
create policy "doc_versions_insert" on public.document_versions for insert to authenticated with check (true);

-- ── TRIGGERS ─────────────────────────────────────────────────────
create trigger trg_site_reports_updated before update on public.site_reports
  for each row execute function public.update_updated_at();
create trigger trg_documents_updated before update on public.documents
  for each row execute function public.update_updated_at();

