import { motion } from "framer-motion";
import { Check, Radio } from "lucide-react";

import type { ReactorModeDefinition } from "@/types/reactor";
import { rgbToCss } from "@/utils/color";
import { cn } from "@/utils/cn";

interface ModeCardProps {
  mode: ReactorModeDefinition;
  selected: boolean;
  onSelect: (mode: ReactorModeDefinition) => void;
}

export const ModeCard = ({ mode, selected, onSelect }: ModeCardProps): JSX.Element => (
  <motion.button
    type="button"
    whileHover={{ y: -5, scale: 1.012 }}
    whileTap={{ scale: 0.99 }}
    onClick={() => onSelect(mode)}
    className={cn(
      "glass-panel min-h-48 rounded-lg p-5 text-left transition",
      selected && "border-reactor-primary/60 shadow-bloom-strong",
    )}
  >
    <div className="flex items-start justify-between">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-reactor-muted">{mode.shortName}</p>
        <h3 className="mt-2 text-2xl font-semibold text-reactor-accent">{mode.name}</h3>
      </div>
      <span
        className="grid size-10 place-items-center rounded-full border"
        style={{
          borderColor: rgbToCss(mode.secondaryColor, 0.38),
          background: `radial-gradient(circle, ${rgbToCss(mode.primaryColor, 0.28)}, transparent 68%)`,
          color: rgbToCss(mode.secondaryColor, 0.95),
        }}
      >
        {selected ? <Check className="size-5" /> : <Radio className="size-5" />}
      </span>
    </div>
    <p className="mt-5 text-sm leading-6 text-reactor-muted">{mode.description}</p>
    <div className="mt-5 grid grid-cols-3 gap-2 text-xs text-reactor-muted">
      <span>Noise {Math.round(mode.noise * 100)}</span>
      <span>Surge {Math.round(mode.surgeFrequency * 100)}</span>
      <span>Bloom {Math.round(mode.bloom * 100)}</span>
    </div>
  </motion.button>
);
