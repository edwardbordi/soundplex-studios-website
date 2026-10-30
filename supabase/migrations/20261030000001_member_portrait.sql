-- Members: a wall portrait (Ed, 2026-10-30).
-- Run once in Supabase → SQL Editor (soundplex-members). Safe to re-run.
--
--  • members.portrait_url  the tall waist-up photo for the Connection Wall (shown black and white
--    there). Stored in the same "avatars" bucket, in the member's own folder (portrait-….webp), so
--    the existing storage policies already cover it.
--  • members.bio already exists (the one line under their name on the wall); members can edit it.

alter table public.members add column if not exists portrait_url text;

alter table public.members drop constraint if exists members_portrait_url_avatars;
alter table public.members add constraint members_portrait_url_avatars
  check (portrait_url is null or portrait_url = '' or portrait_url like 'https://%/storage/v1/object/public/avatars/%');

-- Members may edit their own portrait (bio was already in the profile grant).
grant update (portrait_url, bio) on public.members to authenticated;
