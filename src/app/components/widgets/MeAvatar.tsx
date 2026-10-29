"use client";

import Image from "next/image";
import { photoFor, useVenueSession } from "../../../lib/venue/session";

/**
 * The signed-in member: their profile photo (real members: Supabase storage, so a plain <img>),
 * a demo photo if we have one, else their initial on gold.
 */
export default function MeAvatar({ name, photo: given, size = 32, className = "" }: { name: string; photo?: string; size?: number; className?: string }) {
  // Everywhere "you" appear (menu, board, who's here, toasts) picks up your profile photo.
  const s = useVenueSession();
  const photo = given ?? (s.member ? s.photo : "");
  const box = { width: size, height: size };
  if (photo) {
    // eslint-disable-next-line @next/next/no-img-element -- member photo from Supabase storage (not a site asset)
    return <img src={photo} alt={name} width={size} height={size} style={box} className={`shrink-0 rounded-full object-cover ${className}`} />;
  }
  const demo = photoFor(name);
  if (demo) {
    return <Image src={demo} alt={name} width={size * 2} height={size * 2} style={box} className={`shrink-0 rounded-full object-cover ${className}`} />;
  }
  return (
    <span
      aria-label={name}
      style={{ ...box, background: "#d4a030", fontSize: Math.round(size * 0.42) }}
      className={`grid shrink-0 place-items-center rounded-full font-bold text-[#050505] ${className}`}
    >
      {(name[0] ?? "?").toUpperCase()}
    </span>
  );
}
