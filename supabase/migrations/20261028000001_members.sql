-- ════════════════════════════════════════════════════════════════════════════════════════════
-- SoundPlex members: the database (Ed, 2026-10-28). Project: soundplex-members (East US / Ohio).
--
-- Run ONCE in the Supabase dashboard → SQL Editor → New query → paste → Run.
-- Safe to re-run: every statement checks before it creates.
--
-- The model (design-process/COMPANY-FACTS.md §5):
--   • Membership is BY INVITATION ONLY. George (or his team) invites a member from Studio after
--     checking the membership is paid up; there is no self-signup. Invites and status changes go
--     through the server with the service-role key, never from a browser.
--   • A member signs in with an emailed link. Signed-in + status 'active' = can see the members'
--     side: who's in the building, RSVPs, the directory. 'paused' = can sign in, sees nothing.
--   • Visitors (not signed in) can read NOTHING here. The public Connection Wall still comes from
--     the site's content files.
--
-- Security: Row Level Security on every table, and table privileges granted one by one (the
-- project was created with "Automatically expose new tables" OFF, so nothing is public unless
-- this file says so).
-- ════════════════════════════════════════════════════════════════════════════════════════════

-- ── Members ────────────────────────────────────────────────────────────────────────────────
create table if not exists public.members (
  id          uuid primary key references auth.users (id) on delete cascade,
  email       text not null unique,
  first_name  text not null default '',
  last_name   text not null default '',
  -- "Producer", "Vocalist"… shown under their name.
  role        text not null default '',
  bio         text not null default '',
  -- What they offer / what they're looking for (the directory's two prompts).
  offers      text not null default '',
  looking     text not null default '',
  photo_url   text,
  -- Shown to other members as "in the building" when checked in. Off = invisible, still checks in.
  show_me     boolean not null default true,
  -- Agreed to appear on the public Connection Wall (George publishes it; this records consent).
  on_wall     boolean not null default false,
  -- active = full members' side · paused = membership lapsed (can sign in, sees nothing).
  status      text not null default 'active' check (status in ('active', 'paused')),
  invited_by  text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ── Check-ins: where a member is right now (one row per member, replaced as they move) ────
create table if not exists public.check_ins (
  member_id   uuid primary key references public.members (id) on delete cascade,
  room        text not null check (room in ('wood-room', 'studio-a', 'sound-lounge')),
  -- here = in the room · on_way = "on my way"
  kind        text not null default 'here' check (kind in ('here', 'on_way')),
  created_at  timestamptz not null default now(),
  -- Nobody stays "checked in" forever: it lapses on its own (4 h here, 1 h on the way).
  expires_at  timestamptz not null default (now() + interval '4 hours')
);

-- ── RSVPs: a member saying they're going to an event (events live in the site's content) ──
create table if not exists public.rsvps (
  member_id   uuid not null references public.members (id) on delete cascade,
  event_slug  text not null,
  created_at  timestamptz not null default now(),
  primary key (member_id, event_slug)
);

create index if not exists rsvps_event_idx on public.rsvps (event_slug);
create index if not exists check_ins_expires_idx on public.check_ins (expires_at);

-- ── updated_at on members ─────────────────────────────────────────────────────────────────
create or replace function public.touch_updated_at() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.updated_at := now();
  return new;
end $$;

drop trigger if exists members_touch on public.members;
create trigger members_touch before update on public.members
  for each row execute function public.touch_updated_at();

-- ── "Is the person asking an active member?" (used by every policy) ───────────────────────
-- SECURITY DEFINER so the policies can ask it without recursing through members' own policy.
create or replace function public.is_active_member() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.members m where m.id = auth.uid() and m.status = 'active'
  );
$$;
revoke all on function public.is_active_member() from public;
grant execute on function public.is_active_member() to authenticated;

-- ── Row Level Security ────────────────────────────────────────────────────────────────────
alter table public.members   enable row level security;
alter table public.check_ins enable row level security;
alter table public.rsvps     enable row level security;

-- members: you can always see your own row (so a paused member can see why); active members
-- can see every active member (the directory). Nobody can insert or delete from a browser;
-- you can update only your own profile fields (see the column grant below; status is not one).
drop policy if exists members_select on public.members;
create policy members_select on public.members for select to authenticated
  using (id = auth.uid() or (public.is_active_member() and status = 'active'));

drop policy if exists members_update_own on public.members;
create policy members_update_own on public.members for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

-- check_ins: active members see live check-ins of members who chose to be seen (and always
-- their own); an active member manages only their own check-in.
drop policy if exists check_ins_select on public.check_ins;
create policy check_ins_select on public.check_ins for select to authenticated
  using (
    public.is_active_member()
    and expires_at > now()
    and (
      member_id = auth.uid()
      or exists (select 1 from public.members m where m.id = member_id and m.show_me and m.status = 'active')
    )
  );

drop policy if exists check_ins_write_own on public.check_ins;
create policy check_ins_write_own on public.check_ins for all to authenticated
  using (member_id = auth.uid() and public.is_active_member())
  with check (member_id = auth.uid() and public.is_active_member());

-- rsvps: active members see who's going; an active member adds / removes only their own.
drop policy if exists rsvps_select on public.rsvps;
create policy rsvps_select on public.rsvps for select to authenticated
  using (public.is_active_member());

drop policy if exists rsvps_insert_own on public.rsvps;
create policy rsvps_insert_own on public.rsvps for insert to authenticated
  with check (member_id = auth.uid() and public.is_active_member());

drop policy if exists rsvps_delete_own on public.rsvps;
create policy rsvps_delete_own on public.rsvps for delete to authenticated
  using (member_id = auth.uid() and public.is_active_member());

-- ── Privileges (granted on purpose, table by table; visitors get nothing) ─────────────────
revoke all on public.members, public.check_ins, public.rsvps from anon, authenticated;

grant select on public.members to authenticated;
-- Members may edit their OWN profile fields only, never status / email / invited_by.
grant update (first_name, last_name, role, bio, offers, looking, photo_url, show_me, on_wall)
  on public.members to authenticated;

grant select, insert, update, delete on public.check_ins to authenticated;
grant select, insert, delete on public.rsvps to authenticated;

-- The server (Studio's invite / pause / remove, and the GHL payment sync later) uses the
-- service-role key, which bypasses RLS; it still needs table privileges.
grant all on public.members, public.check_ins, public.rsvps to service_role;

-- ── Live updates: the board and "who's here" update the moment someone checks in ──────────
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'check_ins'
  ) then
    alter publication supabase_realtime add table public.check_ins;
  end if;
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'rsvps'
  ) then
    alter publication supabase_realtime add table public.rsvps;
  end if;
end $$;
