-- Members: contact details for OTHER MEMBERS (Ed, 2026-10-30).
-- Run once in Supabase → SQL Editor (soundplex-members). Safe to re-run.
--
--  • members.phone          optional, shown to members only (members area card + directory)
--  • members.contact_email  optional, separate from the sign-in email, members only
-- Never on the public Connection Wall: the wall must select its columns explicitly and leave
-- these out.

alter table public.members add column if not exists phone text;
alter table public.members add column if not exists contact_email text;

alter table public.members drop constraint if exists members_phone_len;
alter table public.members add constraint members_phone_len check (phone is null or char_length(phone) <= 32);
alter table public.members drop constraint if exists members_contact_email_len;
alter table public.members add constraint members_contact_email_len check (contact_email is null or char_length(contact_email) <= 254);

-- Members may edit their own contact details.
grant update (phone, contact_email) on public.members to authenticated;
