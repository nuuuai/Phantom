import type { BrokerDataType } from "@phantom/shared";

/** Layer-aligned colors per spec: brain / autopilot / shield / sword / amber / gray */
export function dataTypePillClass(t: BrokerDataType): string {
  switch (t) {
    case "name":
      return "border border-[#2d1b69] bg-[#1a1040] text-[#A78BFA]";
    case "phone":
      return "border border-[#1e3a5f] bg-[#1a2332] text-[#60A5FA]";
    case "email":
      return "border border-[#134e2a] bg-[#0d2818] text-[#34D399]";
    case "address":
      return "border border-[#5c1a1a] bg-[#2a0f0f] text-[#F87171]";
    case "age":
      return "border border-amber-900/50 bg-amber-950/40 text-amber-300";
    case "relatives":
      return "border border-ph-border bg-ph-raised text-ph-text-secondary";
  }
}

export function dataTypeLabel(t: BrokerDataType): string {
  if (t === "relatives") return "relatives";
  return t;
}
