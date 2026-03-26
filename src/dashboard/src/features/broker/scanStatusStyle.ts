import type { ScanStatus } from "@phantom/shared";

export function scanStatusLabel(s: ScanStatus): string {
  switch (s) {
    case "not_found":
      return "Not found";
    case "found":
      return "Found";
    case "removal_submitted":
      return "Removal submitted";
    case "removal_confirmed":
      return "Removed";
    case "re_listed":
      return "Re-listed";
  }
}

export function scanStatusDotClass(s: ScanStatus): string {
  switch (s) {
    case "not_found":
      return "bg-ph-text-muted shadow-[0_0_6px_rgba(68,68,78,0.35)]";
    case "found":
      return "bg-ph-warning shadow-[0_0_8px_rgba(251,191,36,0.45)]";
    case "removal_submitted":
      return "bg-ph-warning shadow-[0_0_8px_rgba(251,191,36,0.45)]";
    case "removal_confirmed":
      return "bg-ph-success shadow-[0_0_8px_rgba(52,211,153,0.45)]";
    case "re_listed":
      return "bg-ph-danger shadow-[0_0_8px_rgba(248,113,113,0.45)]";
  }
}

export function scanStatusMonoClass(s: ScanStatus): string {
  switch (s) {
    case "removal_confirmed":
      return "text-ph-success";
    case "re_listed":
      return "text-ph-danger";
    case "removal_submitted":
    case "found":
      return "text-ph-warning";
    case "not_found":
      return "text-ph-text-tertiary";
  }
}
