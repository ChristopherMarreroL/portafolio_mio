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

-- Explicit allowlist for portfolio administrators. Authentication alone must not
-- grant access to the administrative data or media operations.
create table if not exists public.portfolio_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamp with time zone not null default now()
);

alter table public.portfolio_admins enable row level security;
revoke all on public.portfolio_admins from anon, authenticated;

-- On the first migration only, preserve access when the Supabase project has
-- exactly one user. With zero or multiple users the migration intentionally
-- grants nobody and an administrator must be inserted explicitly in SQL.
do $$
declare
  only_user_id uuid;
begin
  if not exists (select 1 from public.portfolio_admins) then
    if (select count(*) from auth.users) = 1 then
      select id into only_user_id from auth.users limit 1;
      insert into public.portfolio_admins (user_id) values (only_user_id)
      on conflict (user_id) do nothing;
    else
      raise notice 'Portfolio admin bootstrap skipped: expected exactly one auth user.';
    end if;
  end if;
end;
$$;

create or replace function public.is_portfolio_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select auth.uid() is not null
    and exists (
      select 1
      from public.portfolio_admins
      where user_id = auth.uid()
    );
$$;

revoke all on function public.is_portfolio_admin() from public;
grant execute on function public.is_portfolio_admin() to authenticated;

-- New and updated URLs must be web URLs. NOT VALID keeps this migration safe
-- when legacy rows need cleanup; PostgreSQL still enforces it for new writes.
alter table public.projects drop constraint if exists projects_image_url_http;
alter table public.projects add constraint projects_image_url_http
  check (image_url is null or image_url ~* '^https?://') not valid;
alter table public.projects drop constraint if exists projects_project_url_http;
alter table public.projects add constraint projects_project_url_http
  check (project_url is null or project_url ~* '^https?://') not valid;
alter table public.projects drop constraint if exists projects_github_url_http;
alter table public.projects add constraint projects_github_url_http
  check (github_url is null or github_url ~* '^https?://') not valid;
alter table public.credentials drop constraint if exists credentials_image_url_http;
alter table public.credentials add constraint credentials_image_url_http
  check (image_url is null or image_url ~* '^https?://') not valid;
alter table public.credentials drop constraint if exists credentials_credential_url_http;
alter table public.credentials add constraint credentials_credential_url_http
  check (credential_url is null or credential_url ~* '^https?://') not valid;

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

-- Only allowlisted administrators can read drafts and manage projects.
drop policy if exists "Authenticated can read all projects" on public.projects;
drop policy if exists "Portfolio admins can read all projects" on public.projects;
create policy "Portfolio admins can read all projects"
on public.projects for select
to authenticated
using ((select public.is_portfolio_admin()));

drop policy if exists "Authenticated can create projects" on public.projects;
drop policy if exists "Portfolio admins can create projects" on public.projects;
create policy "Portfolio admins can create projects"
on public.projects for insert
to authenticated
with check ((select public.is_portfolio_admin()));

drop policy if exists "Authenticated can update projects" on public.projects;
drop policy if exists "Portfolio admins can update projects" on public.projects;
create policy "Portfolio admins can update projects"
on public.projects for update
to authenticated
using ((select public.is_portfolio_admin()))
with check ((select public.is_portfolio_admin()));

drop policy if exists "Authenticated can delete projects" on public.projects;
drop policy if exists "Portfolio admins can delete projects" on public.projects;
create policy "Portfolio admins can delete projects"
on public.projects for delete
to authenticated
using ((select public.is_portfolio_admin()));

-- Public visitors can only read credentials that are explicitly published.
drop policy if exists "Public can read published credentials" on public.credentials;
create policy "Public can read published credentials"
on public.credentials for select
to anon
using (published = true);

drop policy if exists "Authenticated can read all credentials" on public.credentials;
drop policy if exists "Portfolio admins can read all credentials" on public.credentials;
create policy "Portfolio admins can read all credentials"
on public.credentials for select
to authenticated
using ((select public.is_portfolio_admin()));

drop policy if exists "Authenticated can create credentials" on public.credentials;
drop policy if exists "Portfolio admins can create credentials" on public.credentials;
create policy "Portfolio admins can create credentials"
on public.credentials for insert
to authenticated
with check ((select public.is_portfolio_admin()));

drop policy if exists "Authenticated can update credentials" on public.credentials;
drop policy if exists "Portfolio admins can update credentials" on public.credentials;
create policy "Portfolio admins can update credentials"
on public.credentials for update
to authenticated
using ((select public.is_portfolio_admin()))
with check ((select public.is_portfolio_admin()));

drop policy if exists "Authenticated can delete credentials" on public.credentials;
drop policy if exists "Portfolio admins can delete credentials" on public.credentials;
create policy "Portfolio admins can delete credentials"
on public.credentials for delete
to authenticated
using ((select public.is_portfolio_admin()));

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'portfolio-media',
  'portfolio-media',
  true,
  5242880,
  array['image/png', 'image/jpeg', 'image/webp']::text[]
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Anyone can read files from the public portfolio-media bucket.
drop policy if exists "Public can read portfolio media" on storage.objects;
create policy "Public can read portfolio media"
on storage.objects for select
to anon, authenticated
using (bucket_id = 'portfolio-media');

drop policy if exists "Authenticated can upload portfolio media" on storage.objects;
drop policy if exists "Portfolio admins can upload portfolio media" on storage.objects;
create policy "Portfolio admins can upload portfolio media"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'portfolio-media'
  and (select public.is_portfolio_admin())
);

drop policy if exists "Authenticated can update portfolio media" on storage.objects;
drop policy if exists "Portfolio admins can update portfolio media" on storage.objects;
create policy "Portfolio admins can update portfolio media"
on storage.objects for update
to authenticated
using (
  bucket_id = 'portfolio-media'
  and (select public.is_portfolio_admin())
)
with check (
  bucket_id = 'portfolio-media'
  and (select public.is_portfolio_admin())
);

drop policy if exists "Authenticated can delete portfolio media" on storage.objects;
drop policy if exists "Portfolio admins can delete portfolio media" on storage.objects;
create policy "Portfolio admins can delete portfolio media"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'portfolio-media'
  and (select public.is_portfolio_admin())
);



-- Permitir que la API pueda usar el schema public
grant usage on schema public to anon, authenticated;

-- Permisos para visitantes públicos.
-- RLS seguirá limitando que solo vean published = true.
grant select on public.projects to anon;
grant select on public.credentials to anon;

-- Permisos para usuarios autenticados del panel admin.
grant select, insert, update, delete on public.projects to authenticated;
grant select, insert, update, delete on public.credentials to authenticated;
