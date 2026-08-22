import crypto from "node:crypto";
import { getPortalDb } from "@/lib/portal/db";
import {
  createSocialPost,
  listSocialAccounts,
  listSocialPosts,
  type GhlAuth,
  type GhlSocialPost,
} from "@/lib/ghl";
import { claimCreativePostPublishable } from "@/lib/production/publishing";

/**
 * The social content pipeline — the SocialPilot-style layer in front of
 * GHL's Social Planner. GHL remains the publishing engine; this module
 * owns what GHL lacks: an approval workflow (idea → draft →
 * pending_approval → approved → scheduled → published), per-platform
 * text variants, reusable media/hashtags, and queue slots.
 *
 * client_id null means the agency (8E) itself, mirroring resolveGhlAuth.
 */

export type SocialPostStatus =
  | "idea"
  | "draft"
  | "pending_approval"
  | "approved"
  | "rejected"
  | "publishing"
  | "scheduled"
  | "published"
  | "failed"
  | "canceled";

export interface SocialAccountRow {
  id: string;
  client_id: string | null;
  ghl_account_id: string;
  platform: string;
  name: string | null;
  avatar: string | null;
  status: "connected" | "expired" | "disconnected";
  connected_at: string | null;
  last_synced_at: string;
}

export interface SocialMediaItem {
  url: string;
  type?: "image" | "video";
  label?: string;
}

export interface SocialPostRow {
  id: string;
  client_id: string | null;
  summary: string;
  /** Per-platform overrides; empty object = summary everywhere. */
  variants: Record<string, string>;
  media: SocialMediaItem[];
  account_ids: string[];
  status: SocialPostStatus;
  schedule_at: string | null;
  published_at: string | null;
  ghl_post_id: string | null;
  category: string | null;
  created_by: string;
  approval_note: string | null;
  approved_by: string | null;
  approved_at: string | null;
  error: string | null;
  growth_campaign_id: string | null;
  growth_asset_id: string | null;
  growth_content_key: string | null;
  creative_project_id: string | null;
  creative_source_revision_id: string | null;
  creative_approved_hash: string | null;
  creative_content_key: string | null;
  approval_content_hash: string | null;
  publishing_started_at: string | null;
  created_at: string;
  updated_at: string;
}

function throwIfError(error: { message: string } | null): void {
  if (error) throw new Error(error.message);
}

function approvalContentHash(
  post: Pick<
    SocialPostRow,
    "summary" | "variants" | "media" | "account_ids" | "schedule_at" | "category"
  >
): string {
  const variants = Object.fromEntries(
    Object.entries(post.variants ?? {}).sort(([left], [right]) => left.localeCompare(right))
  );
  return crypto
    .createHash("sha256")
    .update(
      JSON.stringify({
        summary: post.summary,
        variants,
        media: post.media,
        accountIds: [...post.account_ids].sort(),
        scheduleAt: post.schedule_at,
        category: post.category,
      })
    )
    .digest("hex");
}

function deliveryGroupKey(post: SocialPostRow, text: string, accountIds: string[]): string {
  return crypto
    .createHash("sha256")
    .update(
      JSON.stringify({
        approvalHash: post.approval_content_hash,
        text,
        accountIds: [...accountIds].sort(),
        media: post.media,
        scheduleAt: post.schedule_at,
      })
    )
    .digest("hex");
}

async function reserveDelivery(
  post: SocialPostRow,
  text: string,
  accountIds: string[]
): Promise<{
  groupKey: string;
  action: "execute" | "skip" | "reconcile";
  ghlPostId: string | null;
  leaseToken: string | null;
  reservedSince: string | null;
}> {
  const groupKey = deliveryGroupKey(post, text, accountIds);
  const { data, error } = await getPortalDb().rpc("reserve_social_delivery", {
    p_post_id: post.id,
    p_group_key: groupKey,
    p_content_hash: post.approval_content_hash ?? approvalContentHash(post),
    p_account_ids: accountIds,
  });
  if (error?.message.includes("DELIVERY_BUSY")) {
    throw new Error("This post variant is already being handed to Go High Level");
  }
  throwIfError(error);
  const row = Array.isArray(data) ? data[0] : data;
  return {
    groupKey,
    action:
      row?.action === "skip"
        ? "skip"
        : row?.action === "reconcile"
          ? "reconcile"
          : "execute",
    ghlPostId: row?.existing_ghl_post_id ?? null,
    leaseToken: row?.delivery_lease_token ?? null,
    reservedSince: row?.reserved_since ?? null,
  };
}

async function completeDelivery(
  postId: string,
  groupKey: string,
  leaseToken: string,
  status: "succeeded" | "failed",
  ghlPostId?: string,
  errorMessage?: string
): Promise<void> {
  const { error } = await getPortalDb().rpc("complete_social_delivery", {
    p_post_id: postId,
    p_group_key: groupKey,
    p_lease_token: leaseToken,
    p_status: status,
    p_ghl_post_id: ghlPostId ?? null,
    p_error: errorMessage ?? null,
  });
  throwIfError(error);
}

function matchingGhlPost(
  posts: GhlSocialPost[],
  input: {
    text: string;
    accountIds: string[];
    mediaUrls: string[];
    scheduleAt: string | null;
    reservedSince: string;
  }
): GhlSocialPost | null {
  const sameSet = (left: string[], right: string[]) =>
    [...left].sort().join("|") === [...right].sort().join("|");
  const earliest = new Date(input.reservedSince).getTime() - 2 * 60 * 1000;
  return (
    posts.find((post) => {
      if (post.summary !== input.text || !post.createdAt) return false;
      if (new Date(post.createdAt).getTime() < earliest) return false;
      if (post.accountIds && !sameSet(post.accountIds, input.accountIds)) return false;
      if (
        !sameSet(
          (post.media ?? []).map((item) => item.url),
          input.mediaUrls
        )
      ) {
        return false;
      }
      if (input.scheduleAt && post.scheduleDate !== input.scheduleAt) return false;
      return true;
    }) ?? null
  );
}

/* ── Account registry (synced from GHL) ──────────── */

/**
 * Pull the connected accounts from GHL and mirror them into
 * portal_social_accounts, marking rows GHL no longer reports as
 * disconnected. Returns the fresh registry for this brand.
 */
export async function syncSocialAccounts(
  clientId: string | null,
  auth: GhlAuth
): Promise<SocialAccountRow[]> {
  const db = getPortalDb();
  const { accounts } = await listSocialAccounts(auth);
  const seen = new Set(accounts.map((a) => a.id));

  // The unique index is expression-based (coalesce over the nullable
  // client_id), which upsert can't target — replace each row instead.
  for (const account of accounts) {
    const deletion = db
      .from("portal_social_accounts")
      .delete()
      .eq("ghl_account_id", account.id);
    await (clientId === null
      ? deletion.is("client_id", null)
      : deletion.eq("client_id", clientId));
    const { error } = await db.from("portal_social_accounts").insert({
      client_id: clientId,
      ghl_account_id: account.id,
      platform: account.platform ?? "unknown",
      name: account.name ?? null,
      avatar: account.avatar ?? null,
      status: "connected",
    });
    throwIfError(error);
  }

  const stale = (await listAccountRegistry(clientId)).filter(
    (row) => !seen.has(row.ghl_account_id)
  );
  for (const row of stale) {
    await db
      .from("portal_social_accounts")
      .update({ status: "disconnected", last_synced_at: new Date().toISOString() })
      .eq("id", row.id);
  }

  return listAccountRegistry(clientId);
}

export async function listAccountRegistry(
  clientId: string | null
): Promise<SocialAccountRow[]> {
  let query = getPortalDb().from("portal_social_accounts").select("*");
  query = clientId === null ? query.is("client_id", null) : query.eq("client_id", clientId);
  const { data, error } = await query.order("platform");
  throwIfError(error);
  return data ?? [];
}

/* ── Post pipeline ───────────────────────────────── */

export async function createPipelinePost(input: {
  clientId: string | null;
  summary: string;
  variants?: Record<string, string>;
  media?: SocialMediaItem[];
  accountIds?: string[];
  status?: Extract<SocialPostStatus, "idea" | "draft" | "pending_approval">;
  scheduleAt?: string;
  category?: string;
  createdBy?: string;
  growthCampaignId?: string;
  growthAssetId?: string;
  growthContentKey?: string;
  creativeProjectId?: string;
  creativeSourceRevisionId?: string;
  creativeApprovedHash?: string;
  creativeContentKey?: string;
}): Promise<SocialPostRow> {
  const { data, error } = await getPortalDb()
    .from("portal_social_posts")
    .insert({
      client_id: input.clientId,
      summary: input.summary,
      variants: input.variants ?? {},
      media: input.media ?? [],
      account_ids: input.accountIds ?? [],
      status: input.status ?? "draft",
      schedule_at: input.scheduleAt ?? null,
      category: input.category ?? null,
      created_by: input.createdBy ?? "staff",
      growth_campaign_id: input.growthCampaignId ?? null,
      growth_asset_id: input.growthAssetId ?? null,
      growth_content_key: input.growthContentKey ?? null,
      creative_project_id: input.creativeProjectId ?? null,
      creative_source_revision_id: input.creativeSourceRevisionId ?? null,
      creative_approved_hash: input.creativeApprovedHash ?? null,
      creative_content_key: input.creativeContentKey ?? null,
    })
    .select("*")
    .single();
  throwIfError(error);
  return data!;
}

export async function listPipelinePosts(
  clientId: string | null,
  statuses?: SocialPostStatus[]
): Promise<SocialPostRow[]> {
  let query = getPortalDb().from("portal_social_posts").select("*");
  query = clientId === null ? query.is("client_id", null) : query.eq("client_id", clientId);
  if (statuses?.length) query = query.in("status", statuses);
  const { data, error } = await query.order("created_at", { ascending: false });
  throwIfError(error);
  return data ?? [];
}

export async function getPipelinePost(id: string): Promise<SocialPostRow | null> {
  const { data, error } = await getPortalDb()
    .from("portal_social_posts")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  throwIfError(error);
  return data;
}

async function updatePost(
  id: string,
  patch: Record<string, unknown>
): Promise<SocialPostRow> {
  const { data, error } = await getPortalDb()
    .from("portal_social_posts")
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select("*")
    .single();
  throwIfError(error);
  return data!;
}

async function updatePostIfCurrent(
  existing: SocialPostRow,
  allowedStatuses: SocialPostStatus[],
  patch: Record<string, unknown>
): Promise<SocialPostRow> {
  const { data, error } = await getPortalDb()
    .from("portal_social_posts")
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq("id", existing.id)
    .eq("updated_at", existing.updated_at)
    .in("status", allowedStatuses)
    .select("*")
    .maybeSingle();
  throwIfError(error);
  if (!data) {
    throw new Error("This post changed in another session. Refresh before continuing.");
  }
  return data;
}

export async function editPipelinePost(
  id: string,
  fields: {
    summary?: string;
    variants?: Record<string, string>;
    media?: SocialMediaItem[];
    accountIds?: string[];
    scheduleAt?: string | null;
    category?: string | null;
  }
): Promise<SocialPostRow> {
  const existing = await getPipelinePost(id);
  if (!existing) throw new Error("Unknown post");
  if (!["idea", "draft", "rejected"].includes(existing.status)) {
    throw new Error("Approved or published content cannot be edited; create a new draft instead");
  }
  const patch: Record<string, unknown> = {};
  if (fields.summary !== undefined) patch.summary = fields.summary;
  if (fields.variants !== undefined) patch.variants = fields.variants;
  if (fields.media !== undefined) patch.media = fields.media;
  if (fields.accountIds !== undefined) patch.account_ids = fields.accountIds;
  if (fields.scheduleAt !== undefined) patch.schedule_at = fields.scheduleAt;
  if (fields.category !== undefined) patch.category = fields.category;
  patch.approval_content_hash = null;
  patch.approved_by = null;
  patch.approved_at = null;
  return updatePostIfCurrent(existing, ["idea", "draft", "rejected"], patch);
}

/** Client-facing decision on a pending_approval post. */
export async function decidePipelinePost(
  id: string,
  decision: "approved" | "rejected",
  by: string,
  note?: string
): Promise<SocialPostRow> {
  const existing = await getPipelinePost(id);
  if (!existing) throw new Error("Unknown post");
  if (!["idea", "draft", "pending_approval"].includes(existing.status)) {
    throw new Error("This post is not awaiting an approval decision");
  }
  return updatePostIfCurrent(existing, ["idea", "draft", "pending_approval"], {
    status: decision,
    approved_by: by,
    approved_at: new Date().toISOString(),
    approval_note: note ?? null,
    approval_content_hash: decision === "approved" ? approvalContentHash(existing) : null,
  });
}

export async function submitForApproval(id: string): Promise<SocialPostRow> {
  const existing = await getPipelinePost(id);
  if (!existing) throw new Error("Unknown post");
  if (!["idea", "draft", "rejected"].includes(existing.status)) {
    throw new Error("Only editable drafts can be submitted for approval");
  }
  return updatePostIfCurrent(existing, ["idea", "draft", "rejected"], {
    status: "pending_approval",
  });
}

export async function cancelPipelinePost(id: string): Promise<SocialPostRow> {
  return updatePost(id, { status: "canceled" });
}

/**
 * Push an approved (or draft, for agency-only brands) post into GHL's
 * Social Planner. With scheduleAt set it schedules; without, it
 * publishes immediately. Records the GHL post id, or the failure.
 *
 * Per-platform variants: accounts whose platform has an override in
 * post.variants get that text; the rest get summary. Accounts sharing
 * the same effective text go out as one GHL post, so identical text
 * still means a single post across all accounts.
 */
export async function pushPipelinePostToGhl(
  id: string,
  auth: GhlAuth
): Promise<SocialPostRow> {
  let post = await getPipelinePost(id);
  if (!post) throw new Error("Unknown post");
  const stalePublishing =
    post.status === "publishing" &&
    Boolean(post.publishing_started_at) &&
    Date.now() - new Date(post.publishing_started_at!).getTime() > 15 * 60 * 1000;
  if (!["approved", "failed"].includes(post.status) && !stalePublishing) {
    throw new Error("Only approved posts can be handed to Go High Level");
  }
  const currentHash = approvalContentHash(post);
  if (post.approval_content_hash && post.approval_content_hash !== currentHash) {
    throw new Error("This post changed after approval; submit the current version for approval again");
  }
  if (post.creative_project_id && !post.approval_content_hash) {
    throw new Error("This production draft needs exact-content approval before publishing");
  }
  if (post.account_ids.length === 0) {
    throw new Error("Pick at least one social account before publishing");
  }

  const { accounts } = await listSocialAccounts(auth);
  const platformOf = new Map(accounts.map((a) => [a.id, a.platform ?? "unknown"]));
  const platforms = post.account_ids.map(
    (accountId) => platformOf.get(accountId) ?? "unknown"
  );
  if (post.creative_project_id) {
    post = await claimCreativePostPublishable({
      post,
      mediaUrls: post.media.map((item) => item.url),
      platforms,
    });
  } else {
    post = await updatePostIfCurrent(
      post,
      stalePublishing ? ["publishing"] : ["approved", "failed"],
      {
        status: "publishing",
        publishing_started_at: new Date().toISOString(),
        error: null,
      }
    );
  }

  const textGroups = new Map<string, string[]>();
  for (const accountId of post.account_ids) {
    const platform = platformOf.get(accountId) ?? "unknown";
    const text = post.variants[platform]?.trim() || post.summary;
    textGroups.set(text, [...(textGroups.get(text) ?? []), accountId]);
  }

  const ghlPostIds: string[] = [];
  try {
    for (const [text, accountIds] of textGroups) {
      let reservation = await reserveDelivery(post, text, accountIds);
      if (reservation.action === "reconcile") {
        if (!reservation.leaseToken || !reservation.reservedSince) {
          throw new Error("The prior delivery lease is incomplete");
        }
        const remotePosts = await listSocialPosts(auth, accountIds);
        const match = matchingGhlPost(remotePosts, {
          text,
          accountIds,
          mediaUrls: post.media.map((item) => item.url),
          scheduleAt: post.schedule_at,
          reservedSince: reservation.reservedSince,
        });
        if (match) {
          const ghlId = match._id ?? match.id;
          await completeDelivery(
            post.id,
            reservation.groupKey,
            reservation.leaseToken,
            "succeeded",
            ghlId
          );
          if (ghlId) ghlPostIds.push(ghlId);
          continue;
        }
        await completeDelivery(
          post.id,
          reservation.groupKey,
          reservation.leaseToken,
          "failed",
          undefined,
          "No matching GHL post found during stale-delivery reconciliation"
        );
        reservation = await reserveDelivery(post, text, accountIds);
      }
      if (reservation.action === "skip") {
        if (reservation.ghlPostId) ghlPostIds.push(reservation.ghlPostId);
        continue;
      }
      if (!reservation.leaseToken) {
        throw new Error("Could not reserve this GHL delivery variant");
      }
      try {
        const result = (await createSocialPost(
          {
            summary: text,
            accountIds,
            mediaUrls: post.media.map((m) => m.url),
            scheduleDate: post.schedule_at ?? undefined,
            status: post.schedule_at ? "scheduled" : "published",
          },
          auth
        )) as { results?: { post?: { _id?: string } } };
        const ghlId = result.results?.post?._id;
        await completeDelivery(
          post.id,
          reservation.groupKey,
          reservation.leaseToken,
          "succeeded",
          ghlId
        );
        if (ghlId) ghlPostIds.push(ghlId);
      } catch (error) {
        const message =
          error instanceof Error ? error.message.slice(0, 400) : "Unknown delivery error";
        // A concrete non-2xx response is a definite rejection and can be
        // retried. Network/parse failures are ambiguous: keep the lease
        // reserved so the next attempt reconciles against GHL first.
        if (/^GHL post create failed \(4\d\d\):/.test(message)) {
          await completeDelivery(
            post.id,
            reservation.groupKey,
            reservation.leaseToken,
            "failed",
            undefined,
            message
          );
        }
        throw error;
      }
    }

    return updatePostIfCurrent(post, ["publishing"], {
      status: post.schedule_at ? "scheduled" : "published",
      published_at: post.schedule_at ? null : new Date().toISOString(),
      ghl_post_id: ghlPostIds.join(",") || null,
      publishing_started_at: null,
      error: null,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message.slice(0, 400) : "Unknown error";
    try {
      await updatePostIfCurrent(post, ["publishing"], {
        status: "failed",
        ghl_post_id: ghlPostIds.join(",") || null,
        publishing_started_at: null,
        error: ghlPostIds.length
          ? `Partially published (${ghlPostIds.length} of ${textGroups.size} variants went out) then failed: ${message}`
          : message,
      });
    } catch (stateError) {
      console.error("Could not mark stale GHL delivery failed", stateError);
    }
    throw err;
  }
}

/* ── Media library ───────────────────────────────── */

export interface MediaAssetRow {
  id: string;
  client_id: string | null;
  label: string;
  url: string;
  type: "image" | "video" | "pdf" | "other";
  tags: string[];
  created_at: string;
}

export async function listMediaAssets(clientId: string | null): Promise<MediaAssetRow[]> {
  let query = getPortalDb().from("portal_media_assets").select("*");
  query = clientId === null ? query.is("client_id", null) : query.eq("client_id", clientId);
  const { data, error } = await query.order("created_at", { ascending: false });
  throwIfError(error);
  return data ?? [];
}

export async function addMediaAsset(input: {
  clientId: string | null;
  label: string;
  url: string;
  type?: MediaAssetRow["type"];
  tags?: string[];
}): Promise<MediaAssetRow> {
  const { data, error } = await getPortalDb()
    .from("portal_media_assets")
    .insert({
      client_id: input.clientId,
      label: input.label,
      url: input.url,
      type: input.type ?? "image",
      tags: input.tags ?? [],
    })
    .select("*")
    .single();
  throwIfError(error);
  return data!;
}

/* ── Hashtag groups & posting slots ──────────────── */

export interface HashtagGroupRow {
  id: string;
  client_id: string | null;
  name: string;
  hashtags: string[];
  created_at: string;
}

export async function listHashtagGroups(clientId: string | null): Promise<HashtagGroupRow[]> {
  let query = getPortalDb().from("portal_hashtag_groups").select("*");
  query = clientId === null ? query.is("client_id", null) : query.eq("client_id", clientId);
  const { data, error } = await query.order("name");
  throwIfError(error);
  return data ?? [];
}

export async function upsertHashtagGroup(input: {
  clientId: string | null;
  name: string;
  hashtags: string[];
}): Promise<void> {
  const existing = (await listHashtagGroups(input.clientId)).find(
    (g) => g.name === input.name
  );
  const db = getPortalDb();
  if (existing) {
    const { error } = await db
      .from("portal_hashtag_groups")
      .update({ hashtags: input.hashtags })
      .eq("id", existing.id);
    throwIfError(error);
    return;
  }
  const { error } = await db.from("portal_hashtag_groups").insert({
    client_id: input.clientId,
    name: input.name,
    hashtags: input.hashtags,
  });
  throwIfError(error);
}

export interface PostingSlotRow {
  id: string;
  client_id: string | null;
  /** 0 = Sunday … 6 = Saturday. */
  weekday: number;
  slot_time: string;
  category: string | null;
  active: boolean;
  created_at: string;
}

export async function listPostingSlots(clientId: string | null): Promise<PostingSlotRow[]> {
  let query = getPortalDb().from("portal_posting_slots").select("*");
  query = clientId === null ? query.is("client_id", null) : query.eq("client_id", clientId);
  const { data, error } = await query.order("weekday").order("slot_time");
  throwIfError(error);
  return data ?? [];
}

export async function addPostingSlot(input: {
  clientId: string | null;
  weekday: number;
  slotTime: string;
  category?: string;
}): Promise<PostingSlotRow> {
  const { data, error } = await getPortalDb()
    .from("portal_posting_slots")
    .insert({
      client_id: input.clientId,
      weekday: input.weekday,
      slot_time: input.slotTime,
      category: input.category ?? null,
    })
    .select("*")
    .single();
  throwIfError(error);
  return data!;
}

export async function deletePostingSlot(id: string): Promise<void> {
  const { error } = await getPortalDb()
    .from("portal_posting_slots")
    .delete()
    .eq("id", id);
  throwIfError(error);
}
