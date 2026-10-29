/**
 * The SoundPlex Gallery's catalog (Ed, 2026-10-28): the art on the walls, for sale.
 *
 * ⚠️ PLACEHOLDER CATALOG. Every piece below is a stand-in (`sample: true`): borrowed images,
 * made-up titles, made-up artists, made-up prices, sizes and rooms, so the store can be built and
 * reviewed. Swap in George's real pieces (photos in public/gallery/, then one entry each) and
 * delete these BEFORE the gallery goes live. A sample piece never takes payment: its Buy button
 * opens a preview checkout instead.
 *
 * Real pieces: set `buyUrl` (a GHL payment link or similar) and `sample: false`; Buy goes there.
 * Order here = "Featured" order on the page (featured pieces float to the top).
 * `wall` = the colored wall behind each piece in the store, computed from the photo (2026-10-28).
 */
export type Medium = "painting" | "drawing" | "sculpture" | "mixed";
export type ArtPiece = {
  slug: string;
  title: string;
  artist: string;
  year: number;
  medium: Medium;
  /** As printed on the label: "Oil on linen". */
  materials: string;
  size: string;
  /** US dollars. */
  price: number;
  /** Which room it hangs in (ROOMS ids in lib/venue/data). */
  room: string;
  status: "available" | "sold" | "on-hold";
  featured?: boolean;
  /** The one piece in the "Featured this month" spotlight at the top of the page. */
  spotlight?: boolean;
  /** Always hangs last in the default view, after sold pieces too (The Lyrist, Ed). */
  last?: boolean;
  width: number;
  height: number;
  alt: string;
  /** The wall it hangs on in the store: two tones taken from the art's own average color,
   *  deepened and muted (a dark corner to a lighter one). Recompute when a photo changes. */
  wall?: [string, string];
  /** Where Buy goes for a real piece (payment link). */
  buyUrl?: string;
  sample?: boolean;
};

export const MEDIUMS: { id: Medium; label: string }[] = [
  { id: "painting", label: "Paintings" },
  { id: "drawing", label: "Drawings" },
  { id: "sculpture", label: "Sculpture" },
  // { id: "mixed", label: "Mixed media" }, — back when the poster-wall panels return with
  // better photos (Ed pulled them 2026-10-28: too low quality from the wall shots).
];

/**
 * ARTISTS (Ed, 2026-10-28: "label the Neoteric art correctly, or as best you can"). The pieces
 * from the Neoteric collection are Lisa Silas's or Matthew Riggs's. CONFIRMED by them: Unease Aunt
 * Louise, Still Life (blue vase), Yellow Ground (Matthew); Sybil, Notes on a Figure (Lisa). The
 * rest follow the Neoteric site's own working rule (sculpture mostly Lisa, painting and drawing
 * mostly Matthew), which they haven't confirmed piece by piece. Titles other than the confirmed
 * ones, and all years, prices and rooms, are still placeholders.
 */
export const ART: ArtPiece[] = [
  { slug: "bust-downcast", title: "Lowered Eyes", artist: "Lisa Silas", year: 2022, medium: "sculpture", materials: "Bronze-finished resin", size: "16 in tall", price: 2750, room: "wood-room", status: "available", featured: false, width: 1600, height: 2400, alt: "Sculpted bust of a young woman with her eyes lowered, mounted on a plain block.", wall: ["#442a22", "#8a5b4c"], sample: true },
  { slug: "study-of-hands", title: "Two Hands", artist: "Lisa Silas", year: 2019, medium: "sculpture", materials: "Bronze-finished resin", size: "14 in tall", price: 4050, room: "studio-a", status: "available", featured: false, width: 1600, height: 2400, alt: "Sculpted study of two hands, lit sharply from one side against a dark ground.", wall: ["#223244", "#4c698a"], sample: true },
  { slug: "still-life-plaster-and-glass", title: "Plaster and Glass", artist: "Matthew Riggs", year: 2021, medium: "painting", materials: "Oil on linen", size: "12 × 15 in", price: 2850, room: "sound-lounge", status: "available", featured: true, width: 1600, height: 1982, alt: "Still life painting: a small plaster figure among glass bottles and folded drapery.", wall: ["#443422", "#8a6e4c"], sample: true },
  { slug: "gilded-bust", title: "The Gilded Woman", artist: "Lisa Silas", year: 2023, medium: "sculpture", materials: "Gilded bronze", size: "14 in tall", price: 3800, room: "wood-room", status: "sold", featured: true, width: 1600, height: 2378, alt: "Gilded bronze bust of a woman on a plinth, warm light across the shoulders.", wall: ["#443322", "#8a6c4c"], sample: true },
  { slug: "charcoal-figure-from-behind", title: "Turning Away", artist: "Matthew Riggs", year: 2019, medium: "drawing", materials: "Charcoal on paper", size: "12 × 16 in", price: 500, room: "studio-a", status: "available", featured: false, width: 1400, height: 1867, alt: "Charcoal study of a standing figure seen from behind, taped to the drawing board.", wall: ["#44223b", "#8a4c79"], sample: true },
  { slug: "head-in-profile", title: "Profile in Shadow", artist: "Lisa Silas", year: 2019, medium: "sculpture", materials: "Bronze-finished resin", size: "22 in tall", price: 3200, room: "sound-lounge", status: "available", featured: false, width: 1600, height: 2225, alt: "Sculpted head seen in profile against a dark ground.", wall: ["#224422", "#4d8a4c"], sample: true },
  { slug: "childs-head", title: "The Child", artist: "Lisa Silas", year: 2023, medium: "sculpture", materials: "Bronze-finished resin", size: "14 in tall", price: 2400, room: "wood-room", status: "available", featured: false, width: 1600, height: 2012, alt: "Sculpted head of a child with curling hair, on a wooden base.", wall: ["#443b22", "#8a794c"], sample: true },
  { slug: "painted-portrait", title: "High Key", artist: "Matthew Riggs", year: 2025, medium: "painting", materials: "Oil on linen", size: "12 × 16 in", price: 2400, room: "studio-a", status: "available", featured: false, width: 1400, height: 1871, alt: "Painted portrait built from blocks of high-key color — a looser, more personal handling.", wall: ["#442a22", "#8a5b4c"], sample: true },
  { slug: "still-life-red-drape", title: "Red Drape", artist: "Matthew Riggs", year: 2020, medium: "painting", materials: "Oil on linen", size: "12 × 12 in", price: 2950, room: "sound-lounge", status: "available", featured: false, width: 742, height: 747, alt: "Still life painting: a glowing form against a red drape, objects gathered on the table below.", wall: ["#442522", "#8a534c"], sample: true },
  { slug: "seated-figure-charcoal", title: "Seated, Late Afternoon", artist: "Lisa Silas", year: 2023, medium: "drawing", materials: "Charcoal on paper", size: "30 × 40 in", price: 900, room: "wood-room", status: "available", featured: false, width: 1200, height: 1600, alt: "Charcoal study of a seated female figure, the drapery behind her rubbed back into the ground.", wall: ["#223244", "#4c698a"], sample: true },
  { slug: "standing-figure-with-anatomy-notes", title: "Notes on a Figure", artist: "Lisa Silas", year: 2023, medium: "drawing", materials: "Charcoal on paper", size: "24 × 32 in", price: 350, room: "studio-a", status: "available", featured: false, width: 1075, height: 1430, alt: "Charcoal study of a standing figure from behind, with smaller anatomical diagrams worked out beside it.", wall: ["#443422", "#8a6e4c"], sample: true },
  { slug: "torso-patinated", title: "Green Torso", artist: "Lisa Silas", year: 2020, medium: "sculpture", materials: "Bronze-finished resin", size: "14 in tall", price: 3000, room: "sound-lounge", status: "available", featured: false, width: 1170, height: 1111, alt: "Sculpted female torso with a mottled green and ochre patina, broken off at the upper arms.", wall: ["#44223b", "#8a4c79"], sample: true },
  { slug: "relief-procession", title: "Procession", artist: "Lisa Silas", year: 2025, medium: "sculpture", materials: "Bronze-finished resin", size: "26 in tall", price: 1600, room: "wood-room", status: "available", featured: false, width: 604, height: 267, alt: "Low-relief panel of a classical procession — seated figures, pipes and dancers in a frieze.", wall: ["#224422", "#4d8a4c"], sample: true },
  { slug: "skull-study", title: "Memento", artist: "Matthew Riggs", year: 2022, medium: "drawing", materials: "Charcoal on paper", size: "18 × 18 in", price: 400, room: "studio-a", status: "sold", featured: false, width: 406, height: 401, alt: "Charcoal study of a human skull in three-quarter view, modeled in soft tone.", wall: ["#443b22", "#8a794c"], sample: true },
  { slug: "young-man-portrait-trimmed", title: "Collar", artist: "Matthew Riggs", year: 2019, medium: "painting", materials: "Oil on linen", size: "24 × 38 in", price: 1250, room: "sound-lounge", status: "available", featured: false, width: 750, height: 1176, alt: "Painted portrait of a young man in a dark t-shirt, one hand raised to his collar.", wall: ["#442a22", "#8a5b4c"], sample: true },
  { slug: "night-figures-trimmed", title: "Around the Fire", artist: "Matthew Riggs", year: 2023, medium: "painting", materials: "Oil on linen", size: "18 × 12 in", price: 3000, room: "wood-room", status: "sold", featured: false, width: 750, height: 499, alt: "Painting of figures gathered around a low fire at night, lit warm against a dark hillside.", wall: ["#442922", "#8a594c"], sample: true },
  { slug: "profile-portrait-headscarf-trimmed", title: "The Headscarf", artist: "Matthew Riggs", year: 2023, medium: "painting", materials: "Oil on linen", size: "12 × 15 in", price: 1400, room: "studio-a", status: "available", featured: false, width: 750, height: 950, alt: "Painted profile portrait of a woman in a patterned headscarf and jacket.", wall: ["#443422", "#8a6d4c"], sample: true },
  { slug: "bearded-man-charcoal-trimmed", title: "The Bearded Man", artist: "Matthew Riggs", year: 2020, medium: "drawing", materials: "Charcoal on paper", size: "30 × 36 in", price: 850, room: "sound-lounge", status: "available", featured: false, width: 750, height: 897, alt: "Charcoal portrait of a bearded man looking out of the picture, drawn on white paper.", wall: ["#223244", "#4c698a"], sample: true },
  { slug: "standing-figure-graphite", title: "Arms Raised", artist: "Matthew Riggs", year: 2023, medium: "drawing", materials: "Graphite on paper", size: "12 × 19 in", price: 650, room: "wood-room", status: "available", featured: false, width: 692, height: 1092, alt: "Graphite study of a standing figure with both arms raised to her hair, on a dark mount.", wall: ["#443422", "#8a6e4c"], sample: true },
  { slug: "still-life-flag", title: "Flag in Green", artist: "Matthew Riggs", year: 2019, medium: "painting", materials: "Oil on linen", size: "24 × 30 in", price: 900, room: "studio-a", status: "available", featured: false, width: 750, height: 925, alt: "Still life painting in high-key greens: a striped flag hung behind a turned wooden form.", wall: ["#224426", "#4c8a55"], sample: true },
  { slug: "self-portrait-cap", title: "Self-Portrait in a Cap", artist: "Matthew Riggs", year: 2022, medium: "painting", materials: "Oil on linen", size: "16 × 22 in", price: 3200, room: "sound-lounge", status: "available", featured: false, width: 710, height: 966, alt: "Painted portrait of a bearded man in a cap, built from broad strokes of orange, blue and green.", wall: ["#443322", "#8a6b4c"], sample: true },
  { slug: "still-life-blue-vase", title: "Still Life", artist: "Matthew Riggs", year: 2025, medium: "painting", materials: "Oil on linen", size: "24 × 17 in", price: 2850, room: "wood-room", status: "available", featured: false, width: 720, height: 540, alt: "Still life painting: a blue-and-white vase, a copper pan, an egg and a small bronze on a draped table.", wall: ["#44223b", "#8a4c79"], sample: true },
  { slug: "ecorche-standing-wall-dim", title: "Écorché", artist: "Lisa Silas", year: 2023, medium: "sculpture", materials: "Fired clay", size: "22 in tall", price: 2700, room: "studio-a", status: "available", featured: false, width: 1591, height: 2000, alt: "Clay écorché of a standing figure, the muscles modeled over the skeleton, on a wooden turntable among sculpting tools.", wall: ["#224422", "#4d8a4c"], sample: true },
  { slug: "unease-aunt-louise", title: "Unease Aunt Louise", artist: "Matthew Riggs", year: 2021, medium: "drawing", materials: "Charcoal and chalk", size: "16 × 20 in", price: 750, room: "sound-lounge", status: "available", featured: true, width: 1600, height: 2030, alt: "Charcoal and chalk portrait of a woman facing straight out, her face emerging from a dark, textured ground.", wall: ["#223344", "#4c6b8a"], sample: true },
  { slug: "portrait-yellow-ground", title: "Yellow Ground", artist: "Matthew Riggs", year: 2024, medium: "painting", materials: "Oil on linen", size: "16 × 20 in", price: 1650, room: "wood-room", status: "available", featured: false, width: 1523, height: 1938, alt: "Painted portrait of a man with a gray mustache, his face built from strokes of blue, violet and orange against a bright yellow-green ground.", wall: ["#404422", "#838a4c"], sample: true },
  { slug: "portrait-yellow-shawl-butterflies", title: "Butterflies", artist: "Matthew Riggs", year: 2023, medium: "painting", materials: "Oil on linen", size: "12 × 15 in", price: 1650, room: "studio-a", status: "available", featured: true, spotlight: true, width: 1600, height: 1995, alt: "Painted portrait of a woman with blue eyes looking up and away, a yellow shawl drawn around her shoulders, two moths in the pale ground beside her.", wall: ["#443222", "#8a684c"], sample: true },
  { slug: "sybil", title: "Sybil", artist: "Lisa Silas", year: 2022, medium: "sculpture", materials: "Bronze-finished resin", size: "26 in tall", price: 2650, room: "sound-lounge", status: "available", featured: false, width: 594, height: 890, alt: "Sculpted bust of an older woman with her face turned upward, the surface pale with traces of gold leaf and green patina, against black.", wall: ["#443b22", "#8a794c"], sample: true },
  // The poster wall (Ed, 2026-10-28): pop-art mixed-media panels, vintage concert-poster imagery
  // collaged on boards. Cut out of a photo of the wall and squared up. Artist, years, sizes,
  // prices: placeholders (the artist name is made up until George says whose they are).
  // The big painting on the WoodRoom's brick wall, by the stage (Ed, 2026-10-28). Real piece,
  // made-up details; image cropped from the WoodRoom photo and squared up (magenta stage light
  // until George sends a proper photo). LAST on purpose (Ed): it clashes with the rest of the
  // collection, so it hangs at the end of the wall.
  { slug: "woodroom-lyrist", title: "The Lyrist", artist: "Rosa Kincaid", year: 2022, medium: "painting", materials: "Acrylic on canvas", size: "36 × 52 in", price: 4800, room: "wood-room", status: "available", featured: false, last: true, width: 760, height: 1080, alt: "A large painting of a crowned figure playing a lyre, in a heavy gilt frame, hanging on the WoodRoom's brick wall", wall: ["#2f1a3a", "#6e4880"], sample: true },
];

export const artBySlug = (slug: string) => ART.find((a) => a.slug === slug);
export const usd = (n: number) => `$${n.toLocaleString("en-US")}`;
