"use client";

import { usePresence } from "../../../lib/members/presence";
import { ROOMS } from "../../../lib/venue/data";
import { Avatar } from "./MemberShell";

/**
 * A member's avatar with the same gold ring as the account menu (top right), plus a dot when
 * they're at the Plex (Ed, 2026-10-30): green = checked in, gold = on their way.
 * Only for members who chose "Show me to other members" (the database leaves the rest out).
 * `bg` is the colour behind it (the ring's gap), as a CSS colour or variable.
 */
// `bg` must be a SOLID colour: the dot's ring is drawn in it (--mx-panel is see-through, which let
// the green show through the ring). The page background matches the account menu's #050505.
export default function PresenceAvatar({ id, photo, name, size, bg = "var(--mx-bg)" }: { id: string; photo: string | null | undefined; name: string; size: number; bg?: string }) {
  const at = usePresence().get(id);
  const room = at ? (ROOMS.find((r) => r.id === at.room)?.name ?? "the Plex") : "";
  const label = at ? (at.kind === "here" ? `At the Plex, in ${room}` : `On the way to ${room}`) : undefined;
  return (
    // Exactly the account menu's look at every size (Ed, 2026-10-30): a 2px gold border, then a
    // 2px gap (the background showing through) before the photo.
    <span className="relative inline-flex shrink-0 rounded-full border-2 border-[#d4a030] p-[2px]" title={label}>
      <Avatar photo={photo ?? ""} name={name} size={size} />
      {at && (
        <span
          // Exactly the account menu's dot (Ed, 2026-10-30): 12px, with a 2px cut-out ring in the
          // background colour, sitting on the bottom-right of the gold border.
          // On the gold border's bottom-right corner, as in the account menu.
          // Centred ON the gold border at the bottom-right (45°), at any size (Ed, 2026-10-31: on
          // the big 80px card avatar the corner of the box was well outside the circle). The
          // circle's 45° point sits 14.6% of its diameter in from the box corner; the dot is 12px.
          className={`absolute h-3 w-3 rounded-full border-2 ${at.kind === "here" ? "bg-[#4cc773]" : "bg-[#d4a030]"}`}
          style={{ borderColor: bg, right: (size + 8) * 0.1464 - 6, bottom: (size + 8) * 0.1464 - 6 }}
          aria-label={label}
          role="img"
        />
      )}
    </span>
  );
}
