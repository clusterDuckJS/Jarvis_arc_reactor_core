import { Switch } from "@/components/ui/switch";
import type { EffectKey } from "@/types/reactor";

interface EffectToggleProps {
  id: EffectKey;
  label: string;
  detail: string;
  enabled: boolean;
  onChange: (effect: EffectKey, enabled: boolean) => void;
}

export const EffectToggle = ({ id, label, detail, enabled, onChange }: EffectToggleProps): JSX.Element => (
  <div className="flex items-center justify-between gap-4 rounded-lg border border-reactor-secondary/10 bg-white/[0.03] p-4">
    <div>
      <p className="text-sm font-semibold text-reactor-accent">{label}</p>
      <p className="mt-1 text-xs leading-5 text-reactor-muted">{detail}</p>
    </div>
    <Switch checked={enabled} onCheckedChange={(checked) => onChange(id, checked)} aria-label={label} />
  </div>
);
