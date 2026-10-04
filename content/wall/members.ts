/**
 * The Connection Wall — members and the threads between them.
 *
 * George's brief: "an interactive wall of member portraits. Selecting someone reveals
 * their story, what they offer, what they're looking for, and — with permission — the
 * collaborations they've formed at SoundPlex. Connections between portraits reveal real
 * stories: met at a Founders gathering → recorded an interview → worked on a project."
 *
 * PLACEHOLDER CAST. Every person and story here is invented so the wall can be designed
 * and demoed. Replace one at a time with real members: swap the portrait file and the
 * four lines, keep the id. Nothing in the component knows which are which.
 *
 * Portraits: /public/wall/<id>-<v>.jpg, 4:5, black-and-white, the hallway style. Until a
 * file exists the tile shows initials on a warm grey — the wall still works.
 *
 * `permission` on a connection is George's rule: a story is only shown if both people
 * have agreed. Default false for anything real until they have.
 */

export interface Member {
  id: string;
  name: string;
  role: string;
  /** One sentence. Who they are in this building. */
  story: string;
  offer: string;
  looking: string;
  /** Portrait path; absent = initials placeholder. */
  portrait?: string;
}

export interface Connection {
  /** Two member ids. Order is the direction the story is told. */
  between: [string, string];
  /** Three short steps: how it started → what happened → where it went. */
  steps: [string, string, string];
  permission: boolean;
}

/**
 * Portraits live at /public/wall/<id>-<v>.jpg. Set here one at a time as they're made.
 * The version is in the FILENAME (next/image won't take a query string on a local src
 * without config, and it caches optimised output by URL — so a portrait replaced under
 * the same name shows stale for days). To swap a portrait: save the new file as the
 * next number and bump it here; delete the old file.
 */
const portrait = (id: string, v = 1) => `/wall/${id}-${v}.jpg`;

// Order is the wall order (6 across on desktop, 3 on a phone) — kept mixed on purpose so
// no row reads as one kind of person. Reorder here, never in the component.
export const MEMBERS: Member[] = [
  { id: "tom", name: "Tom Caruso", role: "Owner, three family restaurants", story: "Third generation. Knew the food was right and the story was invisible.", offer: "A private room and a very good kitchen.", looking: "A way to tell the story that isn’t a brochure.", portrait: portrait("tom") },
  { id: "dana", name: "Dana Whitfield", role: "Founder, a skincare brand", story: "Started the brand at her kitchen table; came here for a launch video and never really left.", offer: "Retail and DTC experience, honest feedback on packaging.", looking: "Product video that doesn’t look like everyone else’s.", portrait: portrait("dana") },
  { id: "andre", name: "Andre Sims", role: "Producer and engineer", story: "Runs the sessions in Studio A. Has heard every kind of nervous.", offer: "Production, engineering, and patience.", looking: "Artists who are ready to actually record.", portrait: portrait("andre") },
  { id: "priya", name: "Priya Raman", role: "Podcast host", story: "Interviews South Jersey business owners upstairs in Studio A, one long conversation at a time.", offer: "An hour of airtime and an audience of local owners.", looking: "Guests worth an hour.", portrait: portrait("priya", 2) },
  { id: "sam", name: "Sam Whitaker", role: "Attorney, mentors founders", story: "Comes for the workshops, stays for the questions afterward.", offer: "Twenty minutes of straight answers about incorporating.", looking: "People at the very beginning.", portrait: portrait("sam") },
  { id: "sofia", name: "Sofia Marin", role: "Founder, a youth arts nonprofit", story: "Needed a room that felt like a night out, not a banquet hall.", offer: "A cause, a mailing list, and volunteers.", looking: "A stage for the annual fundraiser.", portrait: portrait("sofia") },
  { id: "lena", name: "Lena Ortiz", role: "Painter", story: "Her canvases hang in the gallery hall between the studios. Some of them are for sale.", offer: "Original work, commissions, a wall that changes monthly.", looking: "An audience that isn’t only other painters.", portrait: portrait("lena") },
  { id: "ray", name: "Ray Donnelly", role: "Singer-songwriter", story: "Played the Wood Room on a Tuesday to nine people. Came back the next month to forty.", offer: "A set, any night you need one.", looking: "A producer and a release.", portrait: portrait("ray") },
  { id: "marcus", name: "Marcus Bell", role: "Videographer", story: "Shoots for founders who hate being on camera, and makes them forget it’s there.", offer: "Product, brand and event video. A calm set.", looking: "Clients who want a long relationship, not a one-off.", portrait: portrait("marcus") },
  { id: "nia", name: "Kate Thompson", role: "Brand strategist", story: "Left an agency to work only with founders she’d actually have dinner with.", offer: "Positioning, naming, the story under the story.", looking: "Founders with a real product and no words for it yet.", portrait: portrait("nia") },
  { id: "carlos", name: "Danny Reilly", role: "Comedian", story: "Runs a monthly showcase on the Wood Room stage. Fills it.", offer: "A room full of people in a good mood.", looking: "A home room and a reason to bring new people.", portrait: portrait("carlos") },
  { id: "june", name: "June Parker", role: "Photographer", story: "Shot every portrait on this wall. Believes everyone has one good angle.", offer: "Portraits, events, the photo that goes on the website.", looking: "Interesting faces.", portrait: portrait("june") },
];

export const CONNECTIONS: Connection[] = [
  { between: ["dana", "marcus"], steps: ["Met at a Founders gathering", "Shot the launch video in Studio A", "He’s her videographer on retainer"], permission: true },
  { between: ["tom", "priya"], steps: ["A guest on her show", "Told the family story for an hour", "The episode is on the restaurants’ site"], permission: true },
  { between: ["priya", "nia"], steps: ["Kate heard Tom’s episode", "Priya made the introduction", "Kate rebranded all three restaurants"], permission: true },
  { between: ["ray", "andre"], steps: ["Met after a Tuesday show", "Recorded an EP upstairs", "Played the release on the Wood Room stage"], permission: true },
  { between: ["sofia", "carlos"], steps: ["Sat next to each other at a workshop", "His monthly became her fundraiser night", "Raised more than the gala ever did"], permission: true },
  { between: ["sam", "dana"], steps: ["Twenty minutes after a workshop", "She incorporated the next week", "He’s on her advisory board"], permission: true },
  { between: ["june", "lena"], steps: ["June photographed Lena’s opening", "Lena painted June", "Both hang in the gallery hall"], permission: true },
];
