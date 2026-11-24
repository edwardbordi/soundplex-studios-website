import type { MetadataRoute } from "next";

/**
 * The web app manifest (served at /manifest.webmanifest): what "Add to Home Screen" installs.
 *
 * Ed, 2026-11-24: the members area as an app. The icon on the home screen opens straight into
 * /members, full screen with no browser bar (signed out, that's the sign-in page). It's still
 * the website, so every update is in the app the moment it's live; no app store involved.
 * scope "/" so links from the members area to the website stay inside the app.
 *
 * Icons: public/app/ (the SoundPlex monogram on black, made from public/logos/app-icon.png).
 * A sharper original of the monogram from George would make them crisper.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/members",
    name: "SoundPlex Members",
    short_name: "SoundPlex",
    description: "The Plex Collective: who's here, the calendar, members and messages.",
    start_url: "/members?source=app",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#050505",
    theme_color: "#050505",
    icons: [
      { src: "/app/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/app/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/app/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
