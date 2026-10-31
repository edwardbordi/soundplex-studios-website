/**
 * Service categories for the Members filter (Ed, 2026-10-31). "Offers" and "Looking for" are free
 * text, so a member counts as in a category when their words match it (e.g. "podcast",
 * "mixing", "web design"). Words match at the start of a word, so "art" won't match "start".
 * Add words here as members write things the filter misses.
 */
export type Category = { id: string; label: string; words: string[] };

export const CATEGORIES: Category[] = [
  { id: "music", label: "Music & performance", words: ["music", "musician", "band", "drum", "guitar", "bass", "keys", "piano", "vocal", "singer", "sing", "song", "beat", "dj", "gig", "perform", "live set", "session player", "rapper", "artist manage"] },
  { id: "audio", label: "Podcasting & audio", words: ["podcast", "audio", "sound", "engineer", "record", "mix", "master", "voice", "voiceover", "studio time", "co-host", "cohost", "host"] },
  { id: "video", label: "Video & photo", words: ["video", "film", "photo", "camera", "editing", "editor", "director", "cinemat", "reel", "youtube", "content creat"] },
  { id: "design", label: "Design & art", words: ["design", "art", "artist", "paint", "illustrat", "brand", "logo", "creative direct", "graphic", "mural", "gallery"] },
  { id: "web", label: "Web & tech", words: ["web", "website", "site", "developer", "develop", "code", "coding", "app", "software", "tech", "ai", "automation", "seo"] },
  { id: "marketing", label: "Marketing & social", words: ["marketing", "social media", "social", "ads", "advertis", "growth", "promot", "influencer", "audience", "newsletter", "pr "] },
  { id: "business", label: "Business & coaching", words: ["business", "coach", "consult", "founder", "startup", "strategy", "sales", "finance", "invest", "legal", "lawyer", "account", "mentor", "partner"] },
  { id: "events", label: "Events & hosting", words: ["event", "venue", "booking", "book shows", "promoter", "comedy", "comedian", "mc", "emcee", "workshop", "party"] },
  { id: "writing", label: "Writing", words: ["writ", "copy", "author", "script", "lyric", "blog", "story"] },
];

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const RX = new Map(CATEGORIES.map((c) => [c.id, new RegExp(`(^|[^a-z])(${c.words.map(escape).join("|")})`, "i")]));

/** The categories a piece of text falls into. */
export function categoriesOf(text: string): Set<string> {
  const out = new Set<string>();
  if (!text.trim()) return out;
  for (const c of CATEGORIES) if (RX.get(c.id)?.test(text)) out.add(c.id);
  return out;
}
