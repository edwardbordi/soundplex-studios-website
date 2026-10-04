import Link from "next/link";
import { Children } from "react";
import type { ComponentPropsWithoutRef, ReactNode } from "react";
import type { MDXComponents } from "mdx/types";
import OutboundArrow from "../components/OutboundArrow";
import Term from "../components/Term";
import Breakout from "./visuals/Breakout";
import ShortVersion from "./visuals/ShortVersion";

function isExternal(href: string): boolean {
  return /^https?:\/\//.test(href);
}

/**
 * No orphans, guaranteed: glue the last two words of a block together with
 * a non-breaking space so no paragraph ever ends with one lonely word on
 * its own line. (CSS `text-wrap: pretty` does this where supported; this
 * works everywhere.) Only touches a trailing plain-text node — if the
 * block ends in a link/em/etc., it's left alone.
 */
function deorphan(children: ReactNode): ReactNode {
  const arr = Children.toArray(children);
  const last = arr[arr.length - 1];
  if (typeof last === "string") {
    const trimmed = last.replace(/\s+$/, "");
    const i = trimmed.lastIndexOf(" ");
    if (i > 0) {
      arr[arr.length - 1] =
        trimmed.slice(0, i) + "\u00A0" + trimmed.slice(i + 1);
    }
  }
  return arr;
}

/**
 * Component overrides handed to <MDXRemote>. Most element styling lives in the
 * `.blog-prose` CSS (so authored markdown maps straight to the brand); this map
 * only handles links, which need React logic:
 *   - external links → new tab + the site's OutboundArrow (↗)
 *   - internal links → next/link
 * Everything else (headings, lists, blockquotes, code, images) is styled by CSS.
 *
 * Post-specific visuals: build them as components in ./visuals/ and register
 * them here. Keep them PROPS-DRIVEN and generic — a visual with one post's
 * copy and numbers hardcoded belongs to that post's site, not this template.
 * (Six such one-post visuals were removed from the template for that reason.)
 */
const mdxComponents: MDXComponents = {
  // Inline jargon tooltips — <Term definition="...">word</Term> in the .mdx
  // (central definitions live in lib/glossary.ts).
  Term,
  // Generic post visuals — referenced as JSX tags directly in the .mdx body.
  Breakout, // wraps a static image/figure at the shared visual width
  ShortVersion, // "the short version" summary panel near the post top
  p: ({ children, ...rest }: ComponentPropsWithoutRef<"p">) => (
    <p {...rest}>{deorphan(children)}</p>
  ),
  li: ({ children, ...rest }: ComponentPropsWithoutRef<"li">) => (
    <li {...rest}>{deorphan(children)}</li>
  ),
  a: ({ href = "", children, ...rest }: ComponentPropsWithoutRef<"a">) => {
    if (isExternal(href)) {
      return (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="group inline-flex items-center"
          {...rest}
        >
          {children}
          <OutboundArrow />
        </a>
      );
    }
    return (
      <Link href={href} {...rest}>
        {children}
      </Link>
    );
  },
};

export default mdxComponents;
