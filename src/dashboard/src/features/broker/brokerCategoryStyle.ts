import type { BrokerCategory } from "@phantom/shared";

export function brokerCategoryLabel(c: BrokerCategory): string {
  const labels: Record<BrokerCategory, string> = {
    people_search: "People search",
    marketing: "Marketing",
    data_aggregator: "Data aggregator",
    background_check: "Background check",
    public_records: "Public records",
  };
  return labels[c];
}

export function brokerCategoryBadgeClass(c: BrokerCategory): string {
  switch (c) {
    case "people_search":
      return "border border-ph-border bg-ph-raised text-ph-text-secondary";
    case "marketing":
      return "border border-[#2d1b69]/40 bg-[#1a1040]/60 text-[#A78BFA]";
    case "data_aggregator":
      return "border border-[#1e3a5f]/40 bg-[#1a2332]/60 text-[#60A5FA]";
    case "background_check":
      return "border border-[#5c1a1a]/40 bg-[#2a0f0f]/50 text-[#F87171]";
    case "public_records":
      return "border border-[#134e2a]/40 bg-[#0d2818]/50 text-[#34D399]";
  }
}
