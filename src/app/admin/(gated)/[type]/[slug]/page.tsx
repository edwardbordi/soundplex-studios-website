import { notFound } from "next/navigation";
import { NotFoundError } from "@realiizlabs/admin/git";
import { NotHere } from "@realiizlabs/admin/studio";
import { StudioEdit } from "@realiizlabs/admin/studio-ui";
import { studio } from "@/lib/admin/studio";

/** Edit an existing item of any registered type. */
export default async function EditItem({ params }: { params: Promise<{ type: string; slug: string }> }) {
  await studio.requireAdmin();
  const { type, slug } = await params;
  const entry = studio.entry(type);
  if (!entry) notFound();
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) notFound();

  // An open change wins: you should see what you last saved, not what is live.
  const path = (await studio.readers.pathOf(type, slug)) ?? `${entry.folder}/${slug}.mdx`;
  const pending = await studio.readers.pendingFor(path);

  let item: Awaited<ReturnType<typeof studio.readers.readItem>>;
  try {
    item = await studio.readers.readItem(type, slug, pending && !pending.removal ? { ref: pending.branch } : {});
  } catch (err) {
    if (err instanceof NotFoundError || err instanceof NotHere) notFound();
    throw err;
  }
  return (
    <StudioEdit
      typeId={type}
      slug={slug}
      frontmatter={item.frontmatter}
      body={item.body}
      pending={pending ? { number: pending.number, branch: pending.branch, state: pending.state, failingCheck: pending.failingCheck, removal: pending.removal } : null}
    />
  );
}
