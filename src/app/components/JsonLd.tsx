/**
 * Renders a JSON-LD structured-data block as a <script type="application/ld+json">.
 * Per the Next 16 guidance, JSON-LD is data (not executable code), so a native
 * <script> tag is correct. `<` is escaped to < to prevent XSS via injected
 * HTML in any string value.
 */
export default function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, "\\u003c"),
      }}
    />
  );
}
