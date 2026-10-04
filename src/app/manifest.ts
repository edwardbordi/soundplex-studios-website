import type { MetadataRoute } from "next";
import { SITE_NAME, SITE_DESCRIPTION } from "../lib/site-config";

// Web app manifest — Next file convention, served at /manifest.webmanifest.
// Colors are the site tokens; replace the icons in /public/logos with your own.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: SITE_NAME,
    short_name: SITE_NAME,
    description: SITE_DESCRIPTION,
    start_url: "/",
    display: "standalone",
    background_color: "#f7f5f0",
    theme_color: "#0e1726",
    icons: [
      { src: "/logos/favicon.svg", sizes: "any", type: "image/svg+xml" },
      { src: "/logos/app-icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
    ],
  };
}
