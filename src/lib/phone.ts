/**
 * US phone formatting as you type — "(609) 555-0123" — the same rule as the site's forms
 * (Survey.tsx). Keeps digits only, up to 10.
 */
export function formatPhone(value: string): string {
  const d = value.replace(/\D/g, "").replace(/^1(?=\d{10})/, "").slice(0, 10);
  if (d.length <= 3) return d;
  if (d.length <= 6) return `(${d.slice(0, 3)}) ${d.slice(3)}`;
  return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
}
