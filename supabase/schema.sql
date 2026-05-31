-- Portfolio content schema for Supabase.
-- Run this file in the Supabase SQL editor before using the admin panel.

create extension if not exists "pgcrypto";

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title_es text not null,
  title_en text,
  description_es text not null,
  description_en text,
  image_url text,
  project_url text,
  github_url text,
  tools text[] default '{}',
  featured boolean default false,
  published boolean default false,
  sort_order integer default 0,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

create table if not exists public.credentials (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('degree', 'course', 'diploma', 'certification', 'recognition')),
  title_es text not null,
  title_en text,
  issuer text not null,
  issued_date date,
  description_es text,
  description_en text,
  image_url text,
  credential_url text,
  tags text[] default '{}',
  published boolean default false,
  sort_order integer default 0,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists set_projects_updated_at on public.projects;
create trigger set_projects_updated_at
before update on public.projects
for each row execute function public.set_updated_at();

drop trigger if exists set_credentials_updated_at on public.credentials;
create trigger set_credentials_updated_at
before update on public.credentials
for each row execute function public.set_updated_at();

alter table public.projects enable row level security;
alter table public.credentials enable row level security;

-- Public visitors can only read projects that are explicitly published.
drop policy if exists "Public can read published projects" on public.projects;
create policy "Public can read published projects"
on public.projects for select
to anon
using (published = true);

-- Authenticated users can read all projects in the admin panel.
drop policy if exists "Authenticated can read all projects" on public.projects;
create policy "Authenticated can read all projects"
on public.projects for select
to authenticated
using (true);

-- Authenticated users can create projects from the admin panel.
drop policy if exists "Authenticated can create projects" on public.projects;
create policy "Authenticated can create projects"
on public.projects for insert
to authenticated
with check (true);

-- Authenticated users can update any project from the admin panel.
drop policy if exists "Authenticated can update projects" on public.projects;
create policy "Authenticated can update projects"
on public.projects for update
to authenticated
using (true)
with check (true);

-- Authenticated users can delete projects from the admin panel.
drop policy if exists "Authenticated can delete projects" on public.projects;
create policy "Authenticated can delete projects"
on public.projects for delete
to authenticated
using (true);

-- Public visitors can only read credentials that are explicitly published.
drop policy if exists "Public can read published credentials" on public.credentials;
create policy "Public can read published credentials"
on public.credentials for select
to anon
using (published = true);

-- Authenticated users can read all credentials in the admin panel.
drop policy if exists "Authenticated can read all credentials" on public.credentials;
create policy "Authenticated can read all credentials"
on public.credentials for select
to authenticated
using (true);

-- Authenticated users can create credentials from the admin panel.
drop policy if exists "Authenticated can create credentials" on public.credentials;
create policy "Authenticated can create credentials"
on public.credentials for insert
to authenticated
with check (true);

-- Authenticated users can update any credential from the admin panel.
drop policy if exists "Authenticated can update credentials" on public.credentials;
create policy "Authenticated can update credentials"
on public.credentials for update
to authenticated
using (true)
with check (true);

-- Authenticated users can delete credentials from the admin panel.
drop policy if exists "Authenticated can delete credentials" on public.credentials;
create policy "Authenticated can delete credentials"
on public.credentials for delete
to authenticated
using (true);

insert into storage.buckets (id, name, public)
values ('portfolio-media', 'portfolio-media', true)
on conflict (id) do update set public = true;

-- Anyone can read files from the public portfolio-media bucket.
drop policy if exists "Public can read portfolio media" on storage.objects;
create policy "Public can read portfolio media"
on storage.objects for select
to anon, authenticated
using (bucket_id = 'portfolio-media');

-- Only authenticated users can upload files to portfolio-media.
drop policy if exists "Authenticated can upload portfolio media" on storage.objects;
create policy "Authenticated can upload portfolio media"
on storage.objects for insert
to authenticated
with check (bucket_id = 'portfolio-media');

-- Only authenticated users can update files in portfolio-media.
drop policy if exists "Authenticated can update portfolio media" on storage.objects;
create policy "Authenticated can update portfolio media"
on storage.objects for update
to authenticated
using (bucket_id = 'portfolio-media')
with check (bucket_id = 'portfolio-media');

-- Only authenticated users can delete files from portfolio-media.
drop policy if exists "Authenticated can delete portfolio media" on storage.objects;
create policy "Authenticated can delete portfolio media"
on storage.objects for delete
to authenticated
using (bucket_id = 'portfolio-media');



-- Permitir que la API pueda usar el schema public
grant usage on schema public to anon, authenticated;

-- Permisos para visitantes públicos.
-- RLS seguirá limitando que solo vean published = true.
grant select on public.projects to anon;
grant select on public.credentials to anon;

-- Permisos para usuarios autenticados del panel admin.
grant select, insert, update, delete on public.projects to authenticated;
grant select, insert, update, delete on public.credentials to authenticated;