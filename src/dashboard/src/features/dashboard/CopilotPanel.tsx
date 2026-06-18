import type { DashboardOverview } from "@phantom/shared";
import { motion } from "framer-motion";
import { CopilotChat } from "./CopilotChat.js";

interface CopilotPanelProps {
  overview: DashboardOverview;
}

export function CopilotPanel({ overview }: CopilotPanelProps) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: 0.12 }}
      aria-label="Phantom Copilot"
    >
      <CopilotChat prompts={overview.copilotPrompts} />
    </motion.section>
  );
}
