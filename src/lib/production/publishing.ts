import "server-only";

import { getPortalDb } from "@/lib/portal/db";
import type { SocialPostRow } from "@/lib/portal/social";

function throwIfError(error: { message: string } | null): void {
  if (error) throw new Error(error.message);
}

/** Atomically validates approval/rights and reserves external publishing. */
export async function claimCreativePostPublishable(input: {
  post: SocialPostRow;
  mediaUrls: string[];
  platforms: string[];
}): Promise<SocialPostRow> {
  const { data, error } = await getPortalDb().rpc("creative_claim_social_publish", {
    p_post_id: input.post.id,
    p_expected_updated_at: input.post.updated_at,
    p_platforms: input.platforms,
    p_media_urls: input.mediaUrls,
  });
  if (error) {
    const message = error.message;
    if (message.includes("RIGHTS_") || message.includes("MASTER_")) {
      throw new Error("Production rights are no longer valid for every selected platform");
    }
    if (message.includes("REVISION_") || message.includes("PROJECT_")) {
      throw new Error("The production approval is no longer valid");
    }
    if (message.includes("STALE_") || message.includes("POST_NOT_")) {
      throw new Error("This post changed or is already publishing. Refresh before retrying.");
    }
  }
  throwIfError(error);
  return data as SocialPostRow;
}
