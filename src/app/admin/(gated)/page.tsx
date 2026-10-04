import { StudioDashboard } from "@realiizlabs/admin/studio-ui";
import { studio } from "@/lib/admin/studio";

/** Home: one card per content type, from the registry. */
export default async function AdminHome() {
  const { user } = await studio.requireAdmin();
  const first = (user.email ?? "").split("@")[0];
  const greeting = first ? first.charAt(0).toUpperCase() + first.slice(1) : "there";
  const [counts, pending] = await Promise.all([
    Promise.all(studio.entries.map((e) => studio.readers.countItems(e.id))),
    studio.readers.listPendingChanges(),
  ]);
  const cards = studio.entries.map((e, i) => ({ typeId: e.id, count: counts[i], waiting: [...pending.values()].filter((p) => p.typeId === e.id).length }));
  return <StudioDashboard greeting={greeting} cards={cards} />;
}
