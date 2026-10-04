"use client";

import type { ReactNode } from "react";
import { StudioProvider as Provider, type StudioActions } from "@realiizlabs/admin/studio-ui";
import { SITE_NAME } from "../site-config";
import { contentTypes } from "./content-types";

/**
 * Hands the package the two things it cannot import: this site's registry
 * (functions + zod schemas, so it must be imported client-side here, not
 * serialised) and the server actions (created in actions.ts, passed by the layout).
 */
export function StudioProvider({ actions, children }: { actions: StudioActions; children: ReactNode }) {
  return <Provider contentTypes={contentTypes} actions={actions} siteName={SITE_NAME} supportName="your web team">{children}</Provider>;
}
