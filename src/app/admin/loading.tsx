import { StudioLoading } from "@realiizlabs/admin/studio-ui";

/**
 * Cold load: nothing of Studio is on the page yet (the gated layout is still
 * checking the session), so this draws the shell's outline plus a shimmering
 * page until the real thing streams in.
 */
export default function Loading() {
  return <StudioLoading frame />;
}
