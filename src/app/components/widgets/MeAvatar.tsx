import Image from "next/image";
import { photoFor } from "../../../lib/venue/session";

/** The logged-in demo member: their photo if we have one, else their initial on coral. */
export default function MeAvatar({ name, size = 32, className = "" }: { name: string; size?: number; className?: string }) {
  const photo = photoFor(name);
  const box = { width: size, height: size };
  if (photo) {
    return <Image src={photo} alt={name} width={size * 2} height={size * 2} style={box} className={`shrink-0 rounded-full object-cover ${className}`} />;
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
