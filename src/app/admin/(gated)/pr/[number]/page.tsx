import { notFound } from "next/navigation";
import { StudioPullRequest } from "@realiizlabs/admin/studio-ui";
import { studio } from "@/lib/admin/studio";

export default async function PullRequestPage({ params }: { params: Promise<{ number: string }> }) {
  await studio.requireAdmin();
  const { number: raw } = await params;
  const number = Number(raw);
  if (!Number.isInteger(number) || number <= 0) notFound();

  const pr = await studio.readers.getPullRequest(number);
  if (!pr) notFound();
  const status = pr.merged ? null : await studio.readers.prStatus(number);
  const located = pr.postPath ? studio.readers.locate(pr.postPath) : null;
  const item = located
    ? { noun: located.entry.singular?.toLowerCase() ?? "item", label: located.entry.label, typeId: located.typeId, slug: located.slug, liveUrl: studio.readers.publicUrlFor(located.typeId, located.slug) }
    : null;
  return <StudioPullRequest pr={pr} status={status} item={item} />;
}
