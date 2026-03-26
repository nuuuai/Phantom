export const ALIAS_CATEGORIES = [
  { id: "shopping", label: "Shopping" },
  { id: "social", label: "Social" },
  { id: "finance", label: "Finance" },
  { id: "work", label: "Work" },
  { id: "dating", label: "Dating" },
  { id: "newsletter", label: "Newsletter" },
  { id: "temp", label: "Temporary" },
] as const;

export type AliasCategoryId = (typeof ALIAS_CATEGORIES)[number]["id"];
