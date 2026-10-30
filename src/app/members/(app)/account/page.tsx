import { redirect } from "next/navigation";

/** /members/account moved into Settings (Ed, 2026-10-30); old links land on its Profile tab. */
export default function MemberAccountPage() {
  redirect("/members/settings");
}
