import { notFound } from "next/navigation";
import { StudioNew } from "@realiizlabs/admin/studio-ui";
import { studio } from "@/lib/admin/studio";

/**
 * A new item of any registered type. `?from=<slug>` starts it as a copy of an
 * existing item (the Duplicate link on a list row); the package decides what a
 * copy keeps and what it clears.
 */
export default async function NewItem({ params, searchParams }: { params: Promise<{ type: string }>; searchParams: Promise<{ from?: string }> }) {
  await studio.requireAdmin();
  const [{ type }, { from }] = await Promise.all([params, searchParams]);
  if (!studio.entry(type)) notFound();
  // A copy of an item that no longer exists just becomes a plain new item.
  const copied = from ? await studio.readers.startingValues(type, { from }).catch(() => null) : null;
  const initialValues = copied ?? (await studio.readers.startingValues(type));
  return <StudioNew typeId={type} initialValues={initialValues} copiedFrom={copied && from ? from : null} />;
}
