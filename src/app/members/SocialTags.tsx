"use client";

import { useEffect, useRef, useState } from "react";
import { ASK_PLATFORMS, PLATFORMS, fixSocialHost, parseSocial, socialFromHandle, socialLabel } from "../../lib/social";

/**
 * Social accounts as tags, in one compact field (ported from the Root & Reach contact form,
 * restyled for SoundPlex: dark fields, gold accents; Ed, 2026-10-28).
 *
 * Type a handle or link and press Enter (or a comma, or click away) to add it. A small
 * "N added" bubble at the end of the field opens the full list: each account editable inline
 * or removable, with its platform, an "open" link, and help where it's needed (a bare "@handle"
 * asks which app, "instagran.com" offers the fix, YouTube/TikTok/X get a real "Found" lookup
 * through /api/check-social). Anything still typed when they save is picked up via `pending`.
 */
export const MAX_SOCIALS = 8;
const MAX_LEN = 200;

export function shortSocial(v: string): string {
  return v
    .trim()
    .replace(/^https?:\/\//i, "")
    .replace(/^www\./i, "")
    .replace(/\/+$/, "");
}

export default function SocialTags({
  id,
  tags,
  onChange,
  pending,
  onPendingChange,
}: {
  id: string;
  tags: string[];
  onChange: (next: string[]) => void;
  pending: string;
  onPendingChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<number | null>(null);
  const [editValue, setEditValue] = useState("");
  const [found, setFound] = useState<Record<string, boolean | null | "checking">>({});
  const [kept, setKept] = useState<string[]>([]);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) {
        setOpen(false);
        setEditing(null);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        setEditing(null);
      }
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const same = (a: string, b: string) => shortSocial(a).toLowerCase() === shortSocial(b).toLowerCase();

  function needsHelp(t: string): boolean {
    const info = parseSocial(t);
    if (info.problem || info.typoHost) return true;
    return !info.platform && !info.url && !kept.includes(t);
  }

  async function check(t: string) {
    if (!parseSocial(t).checkable) return;
    setFound((m) => ({ ...m, [t]: "checking" }));
    try {
      const res = await fetch("/api/check-social", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ value: t }),
      });
      const data = (await res.json()) as { found?: boolean | null };
      setFound((m) => ({ ...m, [t]: data.found ?? null }));
    } catch {
      setFound((m) => ({ ...m, [t]: null }));
    }
  }

  function added(v: string) {
    void check(v);
    if (needsHelp(v)) setOpen(true);
  }

  function commit(raw: string) {
    const v = raw.replace(/,+$/, "").trim();
    if (!v) return;
    if (!tags.some((t) => same(t, v)) && tags.length < MAX_SOCIALS) {
      onChange([...tags, v]);
      added(v);
    }
    onPendingChange("");
  }

  function replaceAt(i: number, v: string) {
    onChange(tags.map((t, k) => (k === i ? v : t)));
    added(v);
  }

  function remove(i: number) {
    const next = tags.filter((_, k) => k !== i);
    onChange(next);
    setEditing(null);
    if (next.length === 0) setOpen(false);
  }

  function startEdit(i: number) {
    setEditing(i);
    setEditValue(tags[i]);
  }

  function saveEdit() {
    if (editing === null) return;
    const v = editValue.trim();
    if (!v) remove(editing);
    else if (v !== tags[editing] && !tags.some((t, k) => k !== editing && same(t, v))) replaceAt(editing, v);
    setEditing(null);
  }

  const full = tags.length >= MAX_SOCIALS;
  const count = tags.length;
  const attention = tags.some(needsHelp);

  return (
    <div ref={wrapRef} className="relative">
      <div className="relative">
        <input
          id={id}
          value={pending}
          maxLength={MAX_LEN}
          placeholder={full ? "That’s the max" : count === 0 ? "@yourhandle or instagram.com/you" : "Add another"}
          disabled={full}
          onChange={(e) => {
            const v = e.target.value;
            if (v.includes(",")) {
              v.split(",").slice(0, -1).forEach(commit);
              onPendingChange(v.split(",").pop() ?? "");
              return;
            }
            onPendingChange(v);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault(); // add it, don't submit the form
              commit(pending);
            }
          }}
          onBlur={() => commit(pending)}
          aria-describedby={`${id}-hint`}
          className={`w-full rounded-[4px] border border-white/15 bg-[#0b0b0b] px-3.5 py-3 text-[16px] text-white outline-none transition-colors placeholder:text-white/30 focus:border-[#d4a030] ${count ? "pr-28" : ""}`}
        />
        {count > 0 && (
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
            aria-controls={`${id}-list`}
            aria-label={`${count} added${attention ? ", one needs a quick look" : ""}. Show list`}
            className="absolute right-2.5 top-1/2 flex -translate-y-1/2 items-center gap-1 rounded-[4px] bg-[#d4a030]/15 px-2.5 py-1 text-[12.5px] font-semibold text-[#e2b34e] hover:bg-[#d4a030]/25"
          >
            {attention && <span className="h-1.5 w-1.5 rounded-full bg-[#e2b34e]" aria-hidden="true" />}
            {count} added
            <svg viewBox="0 0 12 12" className={`h-2.5 w-2.5 transition-transform ${open ? "rotate-180" : ""}`} aria-hidden="true">
              <path d="M2.5 4.5 6 8l3.5-3.5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        )}
      </div>
      <p id={`${id}-hint`} className="mt-1.5 text-[13px] normal-case tracking-normal text-white/40">
        Press Enter to add more than one.
      </p>

      {open && count > 0 && (
        <ul id={`${id}-list`} className="absolute left-0 right-0 top-[calc(100%-1.4rem)] z-20 mt-1 max-h-72 overflow-auto rounded-[6px] border border-white/12 bg-[#141414] p-1.5 normal-case tracking-normal shadow-2xl">
          {tags.map((t, i) => (
            <li key={`${i}-${t}`} className="flex items-start gap-1 rounded-[4px] px-2 py-1 text-[14.5px] text-white hover:bg-white/[0.05]">
              {editing === i ? (
                <input
                  autoFocus
                  value={editValue}
                  maxLength={MAX_LEN}
                  aria-label="Edit account"
                  onChange={(e) => setEditValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      saveEdit();
                    } else if (e.key === "Escape") {
                      e.stopPropagation();
                      setEditing(null);
                    }
                  }}
                  onBlur={saveEdit}
                  className="min-w-0 flex-1 rounded-[4px] border border-white/20 bg-[#0b0b0b] px-2 py-1 text-[14.5px] text-white outline-none focus:border-[#d4a030]"
                />
              ) : (
                <SocialRow value={t} found={found[t]} kept={kept.includes(t)} onPick={(v) => replaceAt(i, v)} onKeep={() => setKept((k) => [...k, t])} />
              )}
              {editing !== i && (
                <button type="button" onClick={() => startEdit(i)} aria-label={`Edit ${shortSocial(t)}`} className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[4px] text-white/45 hover:bg-white/10 hover:text-white">
                  <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" aria-hidden="true">
                    <path d="M11 2.5l2.5 2.5L6 12.5H3.5V10L11 2.5z" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
                  </svg>
                </button>
              )}
              <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => remove(i)} aria-label={`Remove ${shortSocial(t)}`} className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[4px] text-lg leading-none text-white/45 hover:bg-white/10 hover:text-white">
                ×
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function SocialRow({ value, found, kept, onPick, onKeep }: { value: string; found: boolean | null | "checking" | undefined; kept: boolean; onPick: (next: string) => void; onKeep: () => void }) {
  const info = parseSocial(value);
  const { platform, name } = socialLabel(info);
  const askPlatform = !info.platform && !info.url && !info.problem && !kept;
  const chip = "rounded-[4px] border border-white/15 px-2 py-0.5 text-white hover:border-[#d4a030]/60 hover:bg-white/[0.05]";

  return (
    <div className="min-w-0 flex-1 px-0.5 py-1">
      <div className="flex min-w-0 items-center gap-1.5">
        {platform && <span className="shrink-0 text-[12.5px] text-white/45">{platform}</span>}
        <span className="truncate" title={value}>
          {name}
        </span>
        <span className="ml-auto shrink-0">
          {found === true ? (
            <span className="flex items-center gap-1 text-[12px] font-medium text-[#4cc773]">
              <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" aria-hidden="true">
                <circle cx="8" cy="8" r="7" fill="currentColor" opacity="0.16" />
                <path d="M4.8 8.2 7 10.4l4.2-4.6" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Found
            </span>
          ) : found === false ? (
            <span className="text-[12px] font-medium text-[#ff8a80]">Not found</span>
          ) : found === "checking" ? (
            <span className="text-[12px] text-white/45">Checking…</span>
          ) : info.url && !info.problem && !info.typoHost ? (
            <a href={info.url} target="_blank" rel="noopener noreferrer" className="text-[12px] text-[#d4a030] underline-offset-2 hover:underline">
              open
            </a>
          ) : null}
        </span>
      </div>

      {found === false && <p className="mt-0.5 text-[12.5px] text-white/50">We couldn’t find that account. Double-check it?</p>}
      {info.problem && <p className="mt-0.5 text-[12.5px] text-white/50">{info.problem}. Tap the pencil to fix it.</p>}
      {info.typoHost && (
        <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-[12.5px] text-white/50">
          Did you mean {info.typoHost}?
          <button type="button" onClick={() => onPick(fixSocialHost(value, info.typoHost!))} className="font-medium text-[#e2b34e] hover:underline">
            Yes, fix it
          </button>
        </p>
      )}
      {askPlatform && (
        <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[12.5px] text-white/50">
          Which app?
          {ASK_PLATFORMS.map((p) => (
            <button key={p} type="button" onClick={() => onPick(socialFromHandle(info.handle, p))} className={chip}>
              {PLATFORMS[p].label}
            </button>
          ))}
          <button type="button" onClick={onKeep} className={chip}>
            Other
          </button>
        </div>
      )}
    </div>
  );
}
