import type { Metadata } from "next";
import { SITE_NAME } from "@/lib/site-config";

/**
 * Outer /admin layout: metadata only. The frame and Studio's styles come from
 * @realiizlabs/admin/studio-ui; the session gate lives in (gated)/layout.tsx so
 * sign-in and auth routes sit outside it.
 */
export const metadata: Metadata = {
  title: `${SITE_NAME} Studio`,
  robots: { index: false, follow: false, nocache: true },
};

export const dynamic = "force-dynamic";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
