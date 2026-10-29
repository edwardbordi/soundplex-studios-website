#!/usr/bin/env python3
"""
Pull the hero images for the imported events and posts from the live WordPress site,
convert to WebP, and write the heroImage/heroImageAlt fields into the MDX.

Run ONCE, from the repo root, on a machine with internet access (the build sandbox has none):

    python3 scripts/fetch-legacy-images.py

Needs: Python 3 + Pillow (`pip3 install pillow`). Idempotent — skips files that exist.
Events: image URLs come from the live sitemap (sp-event-sitemap.xml, <image:loc>).
Posts: the mapping below was produced by the import (slug → source image URL).
"""
import io
import re
import sys
import urllib.request
import xml.etree.ElementTree as ET
from pathlib import Path

try:
    from PIL import Image
except ImportError:
    sys.exit("Pillow is required: pip3 install pillow")

ROOT = Path(__file__).resolve().parents[1]
UA = {"User-Agent": "Mozilla/5.0 (compatible; SoundPlexImport/1.0)"}
WP = "https://soundplexstudios.com/wp-content/uploads/"
SQ = "https://images.squarespace-cdn.com/content/v1/5fa1c89c4588f114a833b64d/"

POSTS = {
    "podcasting-studios-near-moorestown": WP + "2025/08/Podcasting-Studios-Near-Moorestown.jpg",
    "podcasting-studios-near-cherry-hill-nj": WP + "2025/07/Podcasting-Studios-Near-Cherry-Hill-NJ.jpg",
    "how-to-create-a-podcast": WP + "2025/06/How-to-Create-a-Podcast.jpg",
    "south-jersey-podcasting-studios-in-pennsauken-nj": WP + "2025/02/podcasting-studios-1.jpg",
    "how-a-professional-rental-recording-studio-can-improve-your-podcast-quality": WP + "2025/02/2-21-24.jpg",
    "discover-affordable-hourly-rates-for-music-studio-rentals": WP + "2025/02/JZdYmcYs.jpeg",
    "local-podcast-studio-insights-availability-rates-and-what-to-expect": WP + "2025/02/studio1-600x406-1.png",
    "is-an-hourly-rental-recording-studio-right-for-voice-over-work": WP + "2025/01/Studio6-1.webp",
    "boost-your-sound-why-professional-music-studios-deliver-superior-audio-quality": WP + "2025/02/9-27-24-1.png",
    "professional-recording-studio-vs-home-setup-why-renting-a-studio-is-your-best-choice": WP + "2025/02/ScreenShot2021-04-01at10.28.10PM.png",
    "mastering-rap-recordings-in-new-jersey": WP + "2025/02/5-30-24.jpg",
    "what-to-look-for-when-renting-a-music-studio": WP + "2025/02/5-22-24.jpg",
    "maximizing-productivity-in-your-music-studio-tips-for-effective-rehearsal-sessions": WP + "2025/02/2-21-24.jpg",
    "exploring-the-soundlounge-at-soundplex-studios": WP + "2025/02/1-23-24.jpg",
    "studio-b-where-music-history-meets-modern-elegance": WP + "2025/02/11-23-23.jpg",
    "the-power-of-place-a-sanctuary-where-artists-can-lose-themselves-the-soundplex": SQ + "b6e4352c-9f04-4348-831d-a0e43ae71ca6/aesthetic-quality-of-a-studio.jpg",
    "the-art-of-adaptability-exploring-the-importance-of-versatility-and-flexibility-in-music-studios": WP + "2023/07/11-29-23.jpg",
    "8-essential-ingredients-what-every-local-musician-needs-in-a-rehearsal-and-recording-studio": WP + "2023/07/equipped-studio.png",
    "the-woodroom-online-gallery-is-now-open": WP + "2021/08/WoodRoom-5-2021.jpg",
    "102-9wmgk-selects-soundplex": WP + "2025/02/aug-1-21.png",
    "10-reasons-to-choose-soundplex-studios": WP + "2025/02/shine1.png",
    "5-awesome-vintage-photos-of-the-soundplex": WP + "2025/02/PERKINSTRAIN1.jpg",
}
# Inline (body) images referenced by the posts: published path → source.
INLINE = {
    "blog/south-jersey-podcast-studio-1.webp": WP + "2025/02/South-Jersey-Podcast-Studio-1.jpg",
    "blog/south-jersey-podcast-studio-2.webp": WP + "2025/02/South-Jersey-Podcast-Studio-2.jpg",
    "blog/south-jersey-podcast-studio-3.webp": WP + "2025/02/South-Jersey-Podcast-Studio-3.jpg",
    "blog/south-jersey-podcast-studio-4.webp": WP + "2025/02/South-Jersey-Podcast-Studio-4.jpg",
    "blog/podcasting-audio-and-video-equipment.webp": WP + "2025/06/podcasting-audio-and-video-equipment.jpg",
    "blog/studio-b-where-music-history-meets-modern-elegance-studio-b.webp": SQ + "1617031292739-DYJE3IF3JCH1IR80Q4FY/StudioB.jpg",
    "blog/the-power-of-place-soundplex-floor-2.webp": SQ + "6a6a398d-fb6d-4c40-b4b7-08a264dd9db1/SoundplexFl2_9_edited+%2811%29.jpg",
    "blog/the-art-of-adaptability-seven-band.webp": SQ + "1629478212121-WDZP79EZ73SGFDD8INLG/Seven+Band.jpg",
    "blog/8-essential-ingredients-comfortable-space.webp": SQ + "1654950688394-Y3ZPQA48FOFPQVJLJPQN/IMG_4073.jpg",
    "blog/8-essential-ingredients-networking.webp": SQ + "afc8fe6c-da71-4317-b136-e31c3f51fb48/FB_IMG_1616775423013.jpg",
    "blog/10-reasons-to-choose-soundplex-studios-control-room.webp": WP + "2025/02/ScreenShot2021-04-01at10.28.10PM.png",
    "blog/10-reasons-to-choose-soundplex-studios-studio-b.webp": WP + "2025/02/StudioB.jpg",
    "blog/10-reasons-to-choose-soundplex-studios-interior.webp": WP + "2025/02/20210327_132659.jpg",
    "blog/5-awesome-vintage-photos-of-the-soundplex-1.webp": WP + "2025/02/PERKINSTRAIN28129.jpg",
    "blog/5-awesome-vintage-photos-of-the-soundplex-2.webp": WP + "2025/02/ScreenShot2021-02-17at7.25.44PM.png",
    "blog/5-awesome-vintage-photos-of-the-soundplex-3.webp": WP + "2025/02/ScreenShot2014-10-19at2.49.28AM.png",
    "blog/5-awesome-vintage-photos-of-the-soundplex-4.webp": WP + "2025/02/ScreenShot2021-04-01at11.11.31PM.png",
    "blog/5-awesome-vintage-photos-of-the-soundplex-5.webp": WP + "2025/02/ScreenShot2021-04-01at11.11.07PM.png",
}
# Room galleries (the live room pages' photos) → public/rooms/<room>-N.webp
ROOMS = {
    "wood-room": [WP + "2025/02/4zphFn6Y-scaled.jpeg", WP + "2025/02/mxIPEVJs-scaled.jpeg", WP + "2025/01/WoodRoom-5-2021.webp", WP + "2025/02/S-a7Fekc.jpeg", WP + "2025/02/JZdYmcYs.jpeg", WP + "2025/01/image-124.webp"],
    "studio-a": [WP + "2025/02/StudioB.jpg", WP + "2025/01/StudioB.webp", WP + "2023/07/equipped-studio.png", WP + "2025/01/image-119.webp", WP + "2025/01/Studio8-1.webp"],
    "podcast-studio": [WP + "2025/02/podcasting-studios-1-1.jpg", WP + "2025/02/South-Jersey-Podcast-Studio-1.jpg", WP + "2025/02/South-Jersey-Podcast-Studio-2.jpg", WP + "2025/02/South-Jersey-Podcast-Studio-3.jpg"],
    "sound-lounge": [WP + "2025/01/IMG_4073.webp", WP + "2025/01/OakBar.png", WP + "2025/02/studio1-600x406-1.png", WP + "2025/02/1-23-24.jpg"],
}


def fetch(url: str) -> bytes | None:
    try:
        with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=30) as r:
            return r.read()
    except Exception as e:  # noqa: BLE001
        print(f"  ! {url} — {e}")
        return None


def to_webp(data: bytes, out: Path, max_w=1600, quality=80) -> bool:
    try:
        im = Image.open(io.BytesIO(data)).convert("RGB")
        if im.width > max_w:
            im = im.resize((max_w, round(im.height * max_w / im.width)), Image.LANCZOS)
        out.parent.mkdir(parents=True, exist_ok=True)
        im.save(out, "WEBP", quality=quality, method=6)
        return True
    except Exception as e:  # noqa: BLE001
        print(f"  ! convert failed for {out.name} — {e}")
        return False


def set_front(path: Path, hero: str, alt: str) -> None:
    text = path.read_text(encoding="utf-8")
    if re.search(r"^heroImage:", text, re.M):
        return
    text = re.sub(r"^(legacyUrl:.*)$", f'heroImage: "{hero}"\nheroImageAlt: "{alt}"\n\\1', text, count=1, flags=re.M)
    path.write_text(text, encoding="utf-8")


def main() -> None:
    # Events
    print("Events…")
    xml = fetch("https://soundplexstudios.com/sp-event-sitemap.xml")
    if xml:
        ns = {"s": "http://www.sitemaps.org/schemas/sitemap/0.9", "i": "http://www.google.com/schemas/sitemap-image/1.1"}
        for url in ET.fromstring(xml).findall("s:url", ns):
            loc = url.findtext("s:loc", default="", namespaces=ns)
            img = url.findtext("i:image/i:loc", default="", namespaces=ns)
            m = re.search(r"/sp-event/([^/]+)/?$", loc)
            if not m or not img:
                continue
            slug = m.group(1)
            mdx = ROOT / "content" / "events" / f"{slug}.mdx"
            if not mdx.exists():
                continue
            out = ROOT / "public" / "events" / f"{slug}.webp"
            if not out.exists():
                data = fetch(img)
                if not data or not to_webp(data, out):
                    continue
                print(f"  ✓ events/{slug}.webp")
            title = re.search(r'^title:\s*"(.*)"', mdx.read_text(encoding="utf-8"), re.M)
            set_front(mdx, f"/events/{slug}.webp", f"Poster for {title.group(1) if title else slug}")
    # Posts
    print("Posts…")
    for slug, src in POSTS.items():
        out = ROOT / "public" / "blog" / f"{slug}.webp"
        if out.exists():
            continue
        data = fetch(src)
        if data and to_webp(data, out):
            print(f"  ✓ blog/{slug}.webp")
    print("Inline images…")
    for rel, src in INLINE.items():
        out = ROOT / "public" / rel
        if out.exists():
            continue
        data = fetch(src)
        if data and to_webp(data, out):
            print(f"  ✓ {rel}")
    print("Rooms…")
    for room, urls in ROOMS.items():
        for i, src in enumerate(urls, 1):
            out = ROOT / "public" / "rooms" / f"{room}-{i}.webp"
            if out.exists():
                continue
            data = fetch(src)
            if data and to_webp(data, out, max_w=2000, quality=82):
                print(f"  ✓ rooms/{room}-{i}.webp")
    print("Done. Posts marked NO IMAGE in the import still need a hero of their own — see the 404s in `npm run dev`.")


if __name__ == "__main__":
    main()
