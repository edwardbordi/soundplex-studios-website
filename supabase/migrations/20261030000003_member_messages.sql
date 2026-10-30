-- Members: private messages between two members, in the app only (Ed, 2026-10-30).
-- Run once in Supabase → SQL Editor (soundplex-members). Safe to re-run.
--
--  • members.messages_from   who can message me: 'everyone' | 'allowed' (only people I allow) | 'nobody'
--  • message_prefs           my allowed list and my blocked list (one row per person: allow or block)
--  • conversations           one per PAIR of members (member_a < member_b), with each side's
--                            "read up to" time for unread counts
--  • messages                the messages themselves
-- Privacy: RLS lets ONLY the two people in a conversation read it, and only you see your own
-- allowed/blocked lists. Nobody writes conversations or messages directly: starting, sending and
-- marking read go through the functions below, which apply the rules in can_message().

-- ── Who can message me ───────────────────────────────────────────────────────────────────
alter table public.members add column if not exists messages_from text not null default 'everyone';
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'members_messages_from_check') then
    alter table public.members add constraint members_messages_from_check check (messages_from in ('everyone', 'allowed', 'nobody'));
  end if;
end $$;
grant update (messages_from) on public.members to authenticated;

-- ── My allowed and blocked lists ─────────────────────────────────────────────────────────
create table if not exists public.message_prefs (
  owner_id uuid not null default auth.uid() references public.members(id) on delete cascade,
  member_id uuid not null references public.members(id) on delete cascade,
  rule text not null check (rule in ('allow', 'block')),
  created_at timestamptz not null default now(),
  primary key (owner_id, member_id),
  constraint message_prefs_not_self check (owner_id <> member_id)
);
alter table public.message_prefs enable row level security;
revoke all on public.message_prefs from anon, authenticated;
grant select, insert, update, delete on public.message_prefs to authenticated;
grant all on public.message_prefs to service_role;

drop policy if exists message_prefs_own on public.message_prefs;
create policy message_prefs_own on public.message_prefs for all to authenticated
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid() and public.is_active_member());

-- ── Conversations and messages ───────────────────────────────────────────────────────────
create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  member_a uuid not null references public.members(id) on delete cascade,
  member_b uuid not null references public.members(id) on delete cascade,
  created_at timestamptz not null default now(),
  last_message_at timestamptz not null default now(),
  a_read_at timestamptz not null default now(),
  b_read_at timestamptz not null default now(),
  constraint conversations_pair_order check (member_a < member_b),
  constraint conversations_pair_unique unique (member_a, member_b)
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_id uuid not null references public.members(id) on delete cascade,
  body text not null check (char_length(btrim(body)) between 1 and 2000),
  created_at timestamptz not null default now()
);
create index if not exists messages_conversation_time on public.messages (conversation_id, created_at);

alter table public.conversations enable row level security;
alter table public.messages enable row level security;

revoke all on public.conversations, public.messages from anon, authenticated;
grant select on public.conversations, public.messages to authenticated;
grant all on public.conversations, public.messages to service_role;

drop policy if exists conversations_select_own on public.conversations;
create policy conversations_select_own on public.conversations for select to authenticated
  using (auth.uid() in (member_a, member_b));

drop policy if exists messages_select_own on public.messages;
create policy messages_select_own on public.messages for select to authenticated
  using (exists (select 1 from public.conversations c where c.id = conversation_id and auth.uid() in (c.member_a, c.member_b)));

-- ── The rule ─────────────────────────────────────────────────────────────────────────────
-- Can I message `target`? Both active; they take messages from everyone, or only from people
-- they allow and I'm on their list; and neither of us has blocked the other.
create or replace function public.can_message(target uuid)
returns boolean language sql security definer set search_path = public stable as $$
  select auth.uid() is not null
    and target <> auth.uid()
    and public.is_active_member()
    and exists (
      select 1 from public.members m
      where m.id = target and m.status = 'active'
        and (
          m.messages_from = 'everyone'
          or (m.messages_from = 'allowed' and exists (
            select 1 from public.message_prefs p where p.owner_id = target and p.member_id = auth.uid() and p.rule = 'allow'))
        )
    )
    and not exists (
      select 1 from public.message_prefs p
      where p.rule = 'block'
        and ((p.owner_id = target and p.member_id = auth.uid()) or (p.owner_id = auth.uid() and p.member_id = target))
    );
$$;

-- Everyone I can message right now (for the message icons in the directory).
create or replace function public.messageable_ids()
returns setof uuid language sql security definer set search_path = public stable as $$
  select m.id from public.members m where m.status = 'active' and m.id <> auth.uid() and public.can_message(m.id);
$$;

-- ── Functions (the only way to write) ────────────────────────────────────────────────────
-- Start (or find) the conversation with another member. Returns its id.
create or replace function public.start_conversation(other uuid)
returns uuid language plpgsql security definer set search_path = public as $$
declare
  me uuid := auth.uid();
  a uuid;
  b uuid;
  cid uuid;
begin
  if me is null or not public.is_active_member() then raise exception 'not an active member'; end if;
  if not public.can_message(other) then raise exception 'not accepting messages'; end if;
  a := least(me, other);
  b := greatest(me, other);
  insert into public.conversations (member_a, member_b) values (a, b) on conflict (member_a, member_b) do nothing;
  select c.id into cid from public.conversations c where c.member_a = a and c.member_b = b;
  return cid;
end $$;

-- Send a message in a conversation you're part of.
create or replace function public.send_message(conv uuid, msg text)
returns public.messages language plpgsql security definer set search_path = public as $$
declare
  me uuid := auth.uid();
  c public.conversations;
  m public.messages;
begin
  if me is null or not public.is_active_member() then raise exception 'not an active member'; end if;
  select * into c from public.conversations where id = conv;
  if c.id is null or me not in (c.member_a, c.member_b) then raise exception 'not your conversation'; end if;
  if not public.can_message(case when c.member_a = me then c.member_b else c.member_a end) then
    raise exception 'not accepting messages';
  end if;
  insert into public.messages (conversation_id, sender_id, body)
    values (conv, me, left(btrim(msg), 2000))
    returning * into m;
  update public.conversations set
    last_message_at = m.created_at,
    a_read_at = case when member_a = me then m.created_at else a_read_at end,
    b_read_at = case when member_b = me then m.created_at else b_read_at end
  where id = conv;
  return m;
end $$;

-- Mark a conversation read (up to now) for the caller.
create or replace function public.mark_read(conv uuid)
returns void language sql security definer set search_path = public as $$
  update public.conversations set
    a_read_at = case when member_a = auth.uid() then now() else a_read_at end,
    b_read_at = case when member_b = auth.uid() then now() else b_read_at end
  where id = conv and auth.uid() in (member_a, member_b);
$$;

-- My conversations, newest first: the other member, the last message, my unread count, and
-- whether I can still message them.
drop function if exists public.my_conversations();
create or replace function public.my_conversations()
returns table (
  id uuid, other_id uuid, first_name text, last_name text, photo_url text, role text,
  can_message boolean, last_body text, last_sender uuid, last_at timestamptz, unread int
) language sql security definer set search_path = public stable as $$
  select
    c.id, o.id, o.first_name, o.last_name, o.photo_url, o.role, public.can_message(o.id),
    lm.body, lm.sender_id, c.last_message_at,
    (select count(*)::int from public.messages m
      where m.conversation_id = c.id and m.sender_id <> auth.uid()
        and m.created_at > case when c.member_a = auth.uid() then c.a_read_at else c.b_read_at end)
  from public.conversations c
  join public.members o on o.id = case when c.member_a = auth.uid() then c.member_b else c.member_a end
  left join lateral (
    select m.body, m.sender_id from public.messages m where m.conversation_id = c.id order by m.created_at desc limit 1
  ) lm on true
  where auth.uid() in (c.member_a, c.member_b)
    and public.is_active_member()
    and lm.body is not null
  order by c.last_message_at desc;
$$;

revoke all on function public.can_message(uuid), public.messageable_ids(), public.start_conversation(uuid), public.send_message(uuid, text), public.mark_read(uuid), public.my_conversations() from public, anon;
grant execute on function public.can_message(uuid), public.messageable_ids(), public.start_conversation(uuid), public.send_message(uuid, text), public.mark_read(uuid), public.my_conversations() to authenticated;

-- ── Live updates ─────────────────────────────────────────────────────────────────────────
-- New messages arrive in the open conversation without a refresh (RLS still applies).
do $$
begin
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'messages') then
    alter publication supabase_realtime add table public.messages;
  end if;
end $$;
