"use server";

/**
 * The site's server actions — one line each. Next only treats a function as a
 * server action when it lives in a file that starts with "use server" and that
 * Next compiles, so these wrappers exist here and the logic lives in the package.
 */

import type { PublishInput } from "@realiizlabs/admin/studio";
import { studio } from "./studio";

const a = () => studio.actions;

export async function updateStudio(number: number) { return a().updateStudio(number); }
export async function nudgeBuild() { return a().nudgeBuild(); }
export async function publishContent(input: PublishInput) { return a().publishContent(input); }
export async function removeContent(input: { type: string; slug: string }) { return a().removeContent(input); }
export async function mergeContentPr(number: number) { return a().mergeContentPr(number); }
export async function discardChange(number: number, branch: string) { return a().discardChange(number, branch); }
export async function previewBody(markdown: string) { return a().previewBody(markdown); }
export async function saveProfile(input: { name: string; displayName: string }) { return a().saveProfile(input); }
export async function saveAvatar(input: { base64: string } | null) { return a().saveAvatar(input); }
export async function changePassword(input: { password: string; confirm: string }) { return a().changePassword(input); }
export async function loadBranding() { return a().loadBranding(); }
export async function saveBranding(input: { name: string; businessEmail: string; businessPhone: string }) { return a().saveBranding(input); }
export async function saveBrandingPicture(input: { kind: "logo" | "favicon"; base64: string | null }) { return a().saveBrandingPicture(input); }
export async function loadMe() { return a().loadMe(); }
export async function loadTeam() { return a().loadTeam(); }
export async function invite(input: { email: string; role: "owner" | "editor" }) { return a().invite(input); }
export async function changeRole(input: { userId: string; role: "owner" | "editor" }) { return a().changeRole(input); }
export async function resend(input: { email: string }) { return a().resend(input); }
export async function remove(input: { userId: string }) { return a().remove(input); }
