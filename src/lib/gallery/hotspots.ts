/**
 * Shoppable photos (Ed, 2026-10-28): where the art for sale appears in the site's photos.
 * Key = the photo's src (as used in the page); `w`/`h` = that photo's pixel size.
 * Each spot = a gallery piece (lib/gallery/art.ts slug) and the four corners of its frame IN THE
 * PHOTO, in the photo's own pixels, clockwise from top-left. Corners (not a box) so the outline
 * hugs the real frame even when the wall is seen at an angle. ShopSpots maps them onto the
 * photo however it's cropped on screen.
 *
 * To add one: open the full-size photo, read off the frame's four outer corners. Sold pieces
 * still show (as sold); a slug missing from the catalog doesn't render.
 */
export type Pt = [number, number];
/** `card`: which side of the frame its hover card opens on, wherever the wall is open in this
 *  photo (so it never covers other art). Falls back if that side is off-screen. */
export type Spot = { slug: string; corners: [Pt, Pt, Pt, Pt]; card?: "right" | "left" | "below" | "above" };

export const HOTSPOTS: Record<string, { w: number; h: number; spots: Spot[] }> = {
  // The WoodRoom FULL of people (home hero, after the empty room fades into it). Only the two
  // pieces the crowd doesn't block. NB this frame is a generated "filled" version of the room,
  // so the paintings in it are close renditions, not exact photos of the pieces.
  "/flythrough/states/state-C-2.jpg": {
    w: 1920,
    h: 1080,
    spots: [
      { slug: "woodroom-lyrist", corners: [[1236, 268], [1420, 262], [1418, 532], [1236, 532]], card: "above" },
      { slug: "portrait-yellow-ground", corners: [[1115, 355], [1182, 355], [1182, 450], [1115, 450]], card: "left" },
    ],
  },
  // The WoodRoom, magenta light (room hero), 1920×1080. Pieces identified by Ed from crops;
  // corners traced on a 4× zoom of each frame.
  "/flythrough/states/state-A.jpg": {
    w: 1920,
    h: 1080,
    spots: [
      // The big painting by the stage. Hung slightly askew (its top edge rises to the right), so
      // the corners follow it. Card above (the lights), since both sides have portraits.
      { slug: "woodroom-lyrist", corners: [[1231, 281], [1421, 262], [1420, 536], [1232, 536]], card: "above" },
      // Cards: the flag's to the left (pillows, open wall), not right (the easel).
      { slug: "still-life-flag", corners: [[1450, 580], [1548, 580], [1548, 691], [1450, 691]], card: "left" },
      // The small figure: below, onto bare brick, clear of the big painting and the portraits.
      { slug: "charcoal-figure-from-behind", corners: [[1144, 530], [1183, 530], [1183, 586], [1144, 586]], card: "below" },
      // "Yellow Ground" (Ed corrected: not "Collar"). Card to the left, onto the brick by the sconce.
      { slug: "portrait-yellow-ground", corners: [[1111, 357], [1177, 357], [1177, 447], [1111, 447]], card: "left" },
      // The bust on the stage table: "Lowered Eyes" (Ed confirmed; no frame, the outline wraps
      // it). Card above, onto the wall.
      { slug: "bust-downcast", corners: [[910, 552], [986, 552], [986, 656], [910, 656]], card: "above" },
    ],
  },
};
