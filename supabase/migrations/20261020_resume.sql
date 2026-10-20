-- CV: a dedicated PDF-only bucket with exactly one writable object.
-- Replacing cv.pdf overwrites it; deleting it removes the stored PDF itself.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('portfolio-resume', 'portfolio-resume', true, 5242880, array['application/pdf']::text[])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Public metadata is limited to the CV so the server can hide absent CV buttons.
drop policy if exists "Public can read portfolio resume metadata" on storage.objects;
create policy "Public can read portfolio resume metadata"
on storage.objects for select
to anon, authenticated
using (bucket_id = 'portfolio-resume' and name = 'cv.pdf');

drop policy if exists "Portfolio admins can upload resume" on storage.objects;
create policy "Portfolio admins can upload resume"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'portfolio-resume' and name = 'cv.pdf'
  and (select public.is_portfolio_admin())
);

drop policy if exists "Portfolio admins can replace resume" on storage.objects;
create policy "Portfolio admins can replace resume"
on storage.objects for update
to authenticated
using (
  bucket_id = 'portfolio-resume' and name = 'cv.pdf'
  and (select public.is_portfolio_admin())
)
with check (
  bucket_id = 'portfolio-resume' and name = 'cv.pdf'
  and (select public.is_portfolio_admin())
);

drop policy if exists "Portfolio admins can delete resume" on storage.objects;
create policy "Portfolio admins can delete resume"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'portfolio-resume' and name = 'cv.pdf'
  and (select public.is_portfolio_admin())
);
