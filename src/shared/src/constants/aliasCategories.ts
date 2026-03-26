export const ALIAS_CATEGORIES = [
  { id: "shopping", label: "Shopping" },
  { id: "social", label: "Social" },
  { id: "work", label: "Work" },
  { id: "finance", label: "Finance" },
  { id: "other", label: "Other" },
] as const;

export type AliasCategoryId = (typeof ALIAS_CATEGORIES)[number]["id"];
