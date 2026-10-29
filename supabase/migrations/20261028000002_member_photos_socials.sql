-- Members: a profile photo and social accounts (Ed, 2026-10-28).
-- Run once in Supabase → SQL Editor (soundplex-members). Safe to re-run.
--
--  • members.socials   up to 8 links/handles ("instagram.com/ed", "@ed"), edited by the member.
--  • members.photo_url already exists; it may only point at this project's "avatars" bucket.
--  • storage bucket "avatars": public to view (photos show on the wall/who's-here), and an
--    ACTIVE member can only add, replace or delete files in their own folder (<their id>/…).

-- ── Socials ──────────────────────────────────────────────────────────────────────────────
alter table public.members add column if not exists socials text[] not null default '{}';

alter table public.members drop constraint if exists members_socials_max;
alter table public.members add constraint members_socials_max check (cardinality(socials) <= 8);

alter table public.members drop constraint if exists members_photo_url_avatars;
alter table public.members add constraint members_photo_url_avatars
  check (photo_url is null or photo_url = '' or photo_url like 'https://%/storage/v1/object/public/avatars/%');

-- Members may edit their own socials (the same column-by-column grant as the other profile fields).
grant update (socials) on public.members to authenticated;

-- ── Avatars bucket ───────────────────────────────────────────────────────────────────────
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatars', 'avatars', true, 2097152, array['image/webp', 'image/jpeg', 'image/png'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists avatars_select_own on storage.objects;
drop policy if exists avatars_insert_own on storage.objects;
drop policy if exists avatars_update_own on storage.objects;
drop policy if exists avatars_delete_own on storage.objects;

-- (Listing/removing through the API needs a select policy; viewing works without it, the bucket is public.)
create policy avatars_select_own on storage.objects for select to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

create policy avatars_insert_own on storage.objects for insert to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text and public.is_active_member());

create policy avatars_update_own on storage.objects for update to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text and public.is_active_member());

create policy avatars_delete_own on storage.objects for delete to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
