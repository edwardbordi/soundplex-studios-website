import { notFound } from "next/navigation";
import { StudioList } from "@realiizlabs/admin/studio-ui";
import { studio } from "@/lib/admin/studio";

/** The list for any content type in the registry — /admin/posts, /admin/speaking, … */
export default async function ItemList({ params }: { params: Promise<{ type: string }> }) {
  await studio.requireAdmin();
  const { type } = await params;
  if (!studio.entry(type)) notFound();
  const items = (await studio.readers.listItems(type)).map((i) => ({
    slug: i.slug, title: i.title, date: i.date, needsAttention: i.needsAttention, isNew: i.isNew,
    liveUrl: studio.readers.publicUrlFor(type, i.slug),
    pending: i.pending ? { number: i.pending.number, state: i.pending.state, removal: i.pending.removal } : null,
  }));
  return <StudioList typeId={type} items={items} />;
}
