import { notFound } from "next/navigation";
import { StudioExtra, StudioList } from "@realiizlabs/admin/studio-ui";
import { studio } from "@/lib/admin/studio";

/**
 * The list for any content type in the registry — /admin/posts, /admin/speaking, … —
 * and any page Studio adds itself (/admin/leads, …): the one-time hook, Studio 0.25.
 */
export default async function ItemList({ params, searchParams }: {
  params: Promise<{ type: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await studio.requireAdmin();
  const { type } = await params;
  if (!studio.entry(type)) {
    const extra = await studio.extraPage(type, await searchParams);
    if (!extra) notFound();
    return <StudioExtra page={extra} />;
  }
  const items = (await studio.readers.listItems(type)).map((i) => ({
    slug: i.slug, title: i.title, date: i.date, needsAttention: i.needsAttention, isNew: i.isNew,
    liveUrl: studio.readers.publicUrlFor(type, i.slug),
    pending: i.pending ? { number: i.pending.number, state: i.pending.state, removal: i.pending.removal } : null,
  }));
  return <StudioList typeId={type} items={items} />;
}
