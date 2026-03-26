import type { AliasCategory } from "@phantom/shared";

export function categoryBadgeClass(category: AliasCategory): string {
  const map: Record<AliasCategory, string> = {
    shopping: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
    social: "border-sky-500/30 bg-sky-500/10 text-sky-300",
    finance: "border-amber-500/30 bg-amber-500/10 text-amber-200",
    work: "border-violet-500/30 bg-violet-500/10 text-violet-200",
    dating: "border-pink-500/30 bg-pink-500/10 text-pink-300",
    newsletter: "border-ph-text-tertiary/40 bg-ph-raised text-ph-text-secondary",
    temp: "border-ph-border text-ph-text-tertiary",
  };
  return map[category];
}

export function categoryLabel(category: AliasCategory): string {
  const map: Record<AliasCategory, string> = {
    shopping: "Shopping",
    social: "Social",
    finance: "Finance",
    work: "Work",
    dating: "Dating",
    newsletter: "Newsletter",
    temp: "Temp",
  };
  return map[category];
}
