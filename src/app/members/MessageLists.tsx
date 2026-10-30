"use client";

import { useEffect, useMemo, useState } from "react";
import { membersBrowser } from "../../lib/members/browser";
import { loadPrefs, setPref, type MessagesFrom, type Pref, type PrefRule } from "../../lib/members/messages";

/**
 * Settings → Privacy → messages (Ed, 2026-10-30): my allowed list and my blocked list.
 *   Allowed: who can message me when I choose "People I allow".
 *   Blocked: never, whatever I choose. Blocking also stops me messaging them.
 * A person is on one list at most. Changes save straight away (no Save button needed).
 */
type Person = { id: string; first_name: string; last_name: string; photo_url: string | null; role: string };
const nameOf = (p: Person) => [p.first_name, p.last_name].filter(Boolean).join(" ") || "Member";

export default function MessageLists({ meId, mode }: { meId: string; mode: MessagesFrom }) {
  const [people, setPeople] = useState<Person[] | null>(null);
  const [prefs, setPrefs] = useState<Pref[]>([]);
  const [failed, setFailed] = useState(false);
  const [saving, setSaving] = useState<string | null>(null);
  const [err, setErr] = useState("");

  useEffect(() => {
    const sb = membersBrowser();
    if (!sb) return;
    let alive = true;
    void (async () => {
      const [{ data, error }, p] = await Promise.all([
        sb.from("members").select("id, first_name, last_name, photo_url, role").eq("status", "active").neq("id", meId).order("first_name"),
        loadPrefs(),
      ]);
      if (!alive) return;
      if (error || !p) return setFailed(true);
      setPeople((data ?? []) as Person[]);
      setPrefs(p);
    })();
    return () => {
      alive = false;
    };
  }, [meId]);

  const byId = useMemo(() => new Map((people ?? []).map((p) => [p.id, p])), [people]);

  const change = async (id: string, rule: PrefRule | null) => {
    setErr("");
    setSaving(id);
    const ok = await setPref(id, rule);
    setSaving(null);
    if (!ok) return setErr("Couldn’t save that. Try again in a moment.");
    setPrefs((cur) => [...cur.filter((p) => p.member_id !== id), ...(rule ? [{ member_id: id, rule }] : [])]);
  };

  if (failed) return <p className="mt-5 text-[13.5px] text-(--mx-muted)">Couldn’t load your lists. Refresh in a moment.</p>;
  if (!people) return <p className="mt-5 text-[13.5px] text-(--mx-muted)">Loading your lists…</p>;

  return (
    <div className="mt-5 grid gap-4">
      <ListBox
        title="Allowed"
        note={mode === "allowed" ? "These people can message you." : "Used when “People I allow” is chosen above."}
        dim={mode !== "allowed"}
        rule="allow"
        prefs={prefs}
        byId={byId}
        people={people}
        saving={saving}
        onChange={change}
      />
      <ListBox title="Blocked" note="They can’t message you, and you can’t message them. They aren’t told." rule="block" prefs={prefs} byId={byId} people={people} saving={saving} onChange={change} />
      {err && <p className="text-[13px] text-[#e2735e]">{err}</p>}
    </div>
  );
}

function ListBox({
  title,
  note,
  dim = false,
  rule,
  prefs,
  byId,
  people,
  saving,
  onChange,
}: {
  title: string;
  note: string;
  dim?: boolean;
  rule: PrefRule;
  prefs: Pref[];
  byId: Map<string, Person>;
  people: Person[];
  saving: string | null;
  onChange: (id: string, rule: PrefRule | null) => void;
}) {
  const [q, setQ] = useState("");
  const on = prefs.filter((p) => p.rule === rule && byId.has(p.member_id)).map((p) => byId.get(p.member_id) as Person);
  const needle = q.trim().toLowerCase();
  const onOther = new Map(prefs.map((p) => [p.member_id, p.rule]));
  const matches = needle ? people.filter((p) => onOther.get(p.id) !== rule && [p.first_name, p.last_name, p.role].join(" ").toLowerCase().includes(needle)).slice(0, 6) : [];

  return (
    <div className={`rounded-[6px] border border-(--mx-line) p-4 ${dim ? "opacity-70" : ""}`}>
      <p className="flex items-center gap-2 text-[13px] uppercase tracking-[0.14em] text-(--mx-muted)">
        {title} <span className="text-(--mx-faint)">{on.length}</span>
      </p>
      <p className="mt-1 text-[13px] text-(--mx-faint)">{note}</p>

      {on.length > 0 && (
        <ul className="mt-3 flex flex-wrap gap-2">
          {on.map((p) => (
            <li key={p.id} className="flex items-center gap-2 rounded-full border border-(--mx-line-strong) py-1 pl-1 pr-1.5 text-[13.5px]">
              <Face p={p} />
              {nameOf(p)}
              <button
                type="button"
                onClick={() => onChange(p.id, null)}
                disabled={saving === p.id}
                aria-label={`Remove ${nameOf(p)} from ${title.toLowerCase()}`}
                className="grid h-6 w-6 place-items-center rounded-full text-(--mx-faint) hover:bg-(--mx-hover) hover:text-(--mx-text) disabled:opacity-50"
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}

      <label className="relative mt-3 block">
        <span className="sr-only">Add someone to {title.toLowerCase()}</span>
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={`Add someone to ${title.toLowerCase()}…`}
          className="w-full rounded-[4px] border border-(--mx-line-strong) bg-(--mx-field) px-3 py-2 text-[15px] text-(--mx-text) outline-none placeholder:text-(--mx-faint) focus:border-(--mx-gold)"
        />
      </label>
      {needle && (
        <ul className="mt-1.5 overflow-hidden rounded-[4px] border border-(--mx-line)">
          {matches.length === 0 ? (
            <li className="px-3 py-2.5 text-[13.5px] text-(--mx-faint)">No one matches “{q.trim()}”.</li>
          ) : (
            matches.map((p) => {
              const elsewhere = onOther.get(p.id);
              return (
                <li key={p.id}>
                  <button
                    type="button"
                    disabled={saving === p.id}
                    onClick={() => {
                      onChange(p.id, rule);
                      setQ("");
                    }}
                    className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-[14px] hover:bg-(--mx-hover) disabled:opacity-50"
                  >
                    <Face p={p} />
                    <span className="min-w-0 flex-1 truncate">
                      {nameOf(p)}
                      {p.role && <span className="text-(--mx-faint)"> · {p.role}</span>}
                    </span>
                    {elsewhere && <span className="shrink-0 text-[12px] text-(--mx-faint)">Moves from {elsewhere === "allow" ? "allowed" : "blocked"}</span>}
                  </button>
                </li>
              );
            })
          )}
        </ul>
      )}
    </div>
  );
}

function Face({ p }: { p: Person }) {
  if (p.photo_url) {
    // eslint-disable-next-line @next/next/no-img-element -- member photo from Supabase storage
    return <img src={p.photo_url} alt="" width={24} height={24} className="h-6 w-6 shrink-0 rounded-full object-cover" />;
  }
  return <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-(--mx-gold) text-[11px] font-bold text-[#141414]">{(p.first_name.trim()[0] ?? "?").toUpperCase()}</span>;
}
