// Which element is wider than the phone? Prints every element whose right edge passes the viewport.
//   npm run build && npx next start -p 3100 &   (or: npm run dev -- -p 3100)
//   node scripts/overflow.mjs /studio-productions [width=375]
import { chromium } from "@playwright/test";

const path = process.argv[2] ?? "/";
const width = Number(process.argv[3] ?? 375);
const base = process.env.BASE_URL ?? "http://localhost:3100";

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width, height: 800 } });
await page.goto(base + path, { waitUntil: "networkidle" });
const result = await page.evaluate((w) => {
  const out = [];
  for (const el of document.querySelectorAll("body *")) {
    const r = el.getBoundingClientRect();
    if (r.right > w + 1 && r.width > 0) {
      const cls = typeof el.className === "string" ? el.className.split(/\s+/).slice(0, 3).join(".") : "";
      out.push(`${Math.round(r.right - w)}px over  <${el.tagName.toLowerCase()}${cls ? "." + cls : ""}>  w=${Math.round(r.width)} x=${Math.round(r.left)}`);
    }
  }
  return { overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth, out: out.slice(0, 25) };
}, width);
console.log(`scrollWidth overflow: ${result.overflow}px`);
console.log(result.out.join("\n") || "(nothing past the edge)");
await browser.close();
