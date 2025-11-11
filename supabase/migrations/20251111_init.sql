-- Core tables
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique,
  display_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  status text not null default 'draft',
  created_by uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.stations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  metadata jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.work_points (
  id uuid primary key default gen_random_uuid(),
  review_id uuid not null references public.reviews(id) on delete cascade,
  station_id uuid references public.stations(id) on delete set null,
  lat double precision,
  lng double precision,
  notes text,
  status text not null default 'open',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.files (
  id uuid primary key default gen_random_uuid(),
  review_id uuid references public.reviews(id) on delete cascade,
  kind text not null,
  path text not null,
  size integer,
  created_at timestamptz not null default now()
);

-- Indexes
create index if not exists idx_reviews_created_by on public.reviews(created_by);
create index if not exists idx_work_points_review_id on public.work_points(review_id);
create index if not exists idx_work_points_station_id on public.work_points(station_id);
create index if not exists idx_files_review_id on public.files(review_id);

-- Updated_at triggers
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

do $$
begin
  if not exists (select 1 from pg_trigger where tgname = 'trg_reviews_updated_at') then
    create trigger trg_reviews_updated_at before update on public.reviews
    for each row execute procedure public.set_updated_at();
  end if;
  if not exists (select 1 from pg_trigger where tgname = 'trg_stations_updated_at') then
    create trigger trg_stations_updated_at before update on public.stations
    for each row execute procedure public.set_updated_at();
  end if;
  if not exists (select 1 from pg_trigger where tgname = 'trg_work_points_updated_at') then
    create trigger trg_work_points_updated_at before update on public.work_points
    for each row execute procedure public.set_updated_at();
  end if;
end $$;

-- RLS
alter table public.profiles enable row level security;
alter table public.reviews enable row level security;
alter table public.stations enable row level security;
alter table public.work_points enable row level security;
alter table public.files enable row level security;

-- Profiles policies
create policy if not exists "Profiles are self-access" on public.profiles
  for select using (id = auth.uid());
create policy if not exists "Profiles self update" on public.profiles
  for update using (id = auth.uid());

-- Reviews policies (owner-based)
create policy if not exists "Reviews owner read" on public.reviews
  for select using (created_by = auth.uid());
create policy if not exists "Reviews owner insert" on public.reviews
  for insert with check (created_by = auth.uid());
create policy if not exists "Reviews owner update" on public.reviews
  for update using (created_by = auth.uid());
create policy if not exists "Reviews owner delete" on public.reviews
  for delete using (created_by = auth.uid());

-- Stations: readable by owners of related reviews via joins is complex; for now, open read and owner-gated writes if single-tenant.
create policy if not exists "Stations read" on public.stations
  for select using (true);
create policy if not exists "Stations write authenticated" on public.stations
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- Work points linked to reviews; allow if user owns parent review
create policy if not exists "Work points read by review owner" on public.work_points
  for select using (exists (select 1 from public.reviews r where r.id = review_id and r.created_by = auth.uid()));
create policy if not exists "Work points insert by review owner" on public.work_points
  for insert with check (exists (select 1 from public.reviews r where r.id = review_id and r.created_by = auth.uid()));
create policy if not exists "Work points update by review owner" on public.work_points
  for update using (exists (select 1 from public.reviews r where r.id = review_id and r.created_by = auth.uid()));
create policy if not exists "Work points delete by review owner" on public.work_points
  for delete using (exists (select 1 from public.reviews r where r.id = review_id and r.created_by = auth.uid()));

-- Files: tied to reviews
create policy if not exists "Files read by review owner" on public.files
  for select using (exists (select 1 from public.reviews r where r.id = review_id and r.created_by = auth.uid()));
create policy if not exists "Files write by review owner" on public.files
  for all using (exists (select 1 from public.reviews r where r.id = review_id and r.created_by = auth.uid()))
  with check (exists (select 1 from public.reviews r where r.id = review_id and r.created_by = auth.uid()));


