import type { ActivityLayerType } from "@phantom/shared";

export const LAYER_STYLES: Record<
  ActivityLayerType,
  { bg: string; text: string; border: string }
> = {
  shield: { bg: "#0d2818", text: "#34D399", border: "#134e2a" },
  brain: { bg: "#1a1040", text: "#A78BFA", border: "#2d1b69" },
  sword: { bg: "#2a0f0f", text: "#F87171", border: "#5c1a1a" },
  autopilot: { bg: "#1a2332", text: "#60A5FA", border: "#1e3a5f" },
};
