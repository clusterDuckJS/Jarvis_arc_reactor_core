import { motion } from "framer-motion";
import { Power } from "lucide-react";

import { cn } from "@/utils/cn";

interface PowerButtonProps {
  powered: boolean;
  onToggle: () => void;
}

export const PowerButton = ({ powered, onToggle }: PowerButtonProps): JSX.Element => (
  <motion.button
    type="button"
    onClick={onToggle}
    whileTap={{ scale: 0.96 }}
    animate={{
      boxShadow: powered
        ? "0 0 48px rgba(97,232,255,0.36), inset 0 0 34px rgba(97,232,255,0.18)"
        : "0 0 28px rgba(255,77,90,0.2), inset 0 0 24px rgba(255,77,90,0.08)",
    }}
    transition={{ duration: 0.8, repeat: powered ? Infinity : 0, repeatType: "mirror" }}
    className={cn(
      "relative grid aspect-square w-full max-w-72 place-items-center rounded-full border bg-black/40",
      powered ? "border-reactor-primary/[0.55] text-reactor-primary" : "border-reactor-danger/[0.45] text-reactor-danger",
    )}
    aria-label={powered ? "Power off" : "Power on"}
  >
    <span className="absolute inset-4 rounded-full border border-current/20" />
    <span className="absolute inset-9 rounded-full border border-current/[0.15]" />
    <span className="grid size-24 place-items-center rounded-full border border-current/[0.35] bg-white/[0.04]">
      <Power className="size-10" />
    </span>
  </motion.button>
);
