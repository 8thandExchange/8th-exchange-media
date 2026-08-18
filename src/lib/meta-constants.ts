/** Shared Meta enums — safe for client and server. Keep node/crypto out. */

export const META_CAMPAIGN_OBJECTIVES = [
  { value: "OUTCOME_TRAFFIC", label: "Traffic — send people to a page" },
  { value: "OUTCOME_LEADS", label: "Leads — forms, messages, calls" },
  { value: "OUTCOME_AWARENESS", label: "Awareness — reach people who don't know you" },
  { value: "OUTCOME_ENGAGEMENT", label: "Engagement — comments, follows, video views" },
  { value: "OUTCOME_SALES", label: "Sales — purchases / checkout" },
] as const;

export type MetaCampaignObjective = (typeof META_CAMPAIGN_OBJECTIVES)[number]["value"];

export const CAPI_EVENT_NAMES = [
  "PageView",
  "ViewContent",
  "Lead",
  "Contact",
  "CompleteRegistration",
  "Schedule",
] as const;

export type CapiEventName = (typeof CAPI_EVENT_NAMES)[number];
