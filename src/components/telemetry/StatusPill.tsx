import { Activity, Bluetooth, RadioTower } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import type { BleTransport } from "@/types/bluetooth";

interface StatusPillProps {
  connected: boolean;
  transport: BleTransport;
}

export const StatusPill = ({ connected, transport }: StatusPillProps): JSX.Element => {
  const Icon = connected ? Bluetooth : transport === "web-bluetooth" ? Activity : RadioTower;
  const label = connected ? transport : "offline";

  return (
    <Badge variant={connected ? "success" : "muted"} className="gap-2">
      <Icon className="size-3" />
      {label}
    </Badge>
  );
};
