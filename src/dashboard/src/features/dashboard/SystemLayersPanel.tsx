import type { SystemLayerStatus } from "@phantom/shared";
import { motion } from "framer-motion";
import { LAYER_STYLES } from "@/lib/layerColors.js";

interface SystemLayersPanelProps {
  layers: readonly SystemLayerStatus[];
}

export function SystemLayersPanel({ layers }: SystemLayersPanelProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.4 }}
      className="rounded-xl border border-ph-border bg-ph-surface p-5"
    >
      <div className="mb-3.5 font-mono text-xs font-semibold uppercase tracking-wide text-ph-text-tertiary">
        System layers
      </div>
      {layers.map((l, i) => {
        const lc = LAYER_STYLES[l.layer];
        return (
          <div
            key={l.name}
            className={`flex items-center gap-3 py-2.5 ${
              i < layers.length - 1 ? "border-b border-ph-borderSubtle" : ""
            }`}
          >
            <div
              className="h-2 w-2 shrink-0 rounded-sm"
              style={{
                backgroundColor: lc.text,
                boxShadow: `0 0 6px ${lc.text}50`,
              }}
            />
            <div className="min-w-0 flex-1">
              <span className="font-sans text-[13px] font-medium text-[#c0c0c8]">
                {l.name}
              </span>
            </div>
            <span className="shrink-0 font-sans text-[11px] text-ph-text-tertiary">
              {l.status}
            </span>
          </div>
        );
      })}
    </motion.div>
  );
}
