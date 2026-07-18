import { AnimatePresence, motion } from "framer-motion";
import {
  Activity,
  BatteryCharging,
  Bluetooth,
  Cpu,
  Gauge,
  Home,
  Power,
  Settings,
  SlidersHorizontal,
  TerminalSquare,
  Zap,
} from "lucide-react";
import { NavLink, Outlet, useLocation } from "react-router-dom";

import { StatusPill } from "@/components/telemetry/StatusPill";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useBleController } from "@/hooks/useBleController";
import { useReactorRuntime } from "@/hooks/useReactorRuntime";
import { useReactorStore } from "@/store/useReactorStore";
import { formatPercent } from "@/utils/format";
import { cn } from "@/utils/cn";

const navItems = [
  { to: "/dashboard", label: "Dashboard", icon: Home },
  { to: "/controls", label: "Controls", icon: SlidersHorizontal },
  { to: "/modes", label: "Modes", icon: Zap },
  { to: "/diagnostics", label: "Diagnostics", icon: Gauge },
  { to: "/console", label: "Developer Console", icon: TerminalSquare },
  { to: "/settings", label: "Settings", icon: Settings },
] as const;

export const AppShell = (): JSX.Element => {
  const location = useLocation();
  const { connect, disconnect, connecting } = useBleController();
  const connected = useReactorStore((state) => state.connected);
  const transport = useReactorStore((state) => state.transport);
  const battery = useReactorStore((state) => state.battery);
  const power = useReactorStore((state) => state.power);
  const mode = useReactorStore((state) => state.mode);
  const diagnostics = useReactorStore((state) => state.diagnostics);
  useReactorRuntime();

  return (
    <TooltipProvider delayDuration={120}>
      <div className="min-h-screen bg-reactor-bg text-reactor-accent">
        <div className="fixed inset-0 -z-10 reactor-grid bg-reactor-radial opacity-80" />
        <div className="fixed inset-x-0 top-0 z-40 border-b border-reactor-secondary/10 bg-reactor-bg/[0.72] backdrop-blur-2xl lg:left-24">
          <header className="flex h-16 items-center justify-between gap-4 px-4 md:px-6">
            <div className="flex min-w-0 items-center gap-3">
              <div className="grid size-10 place-items-center rounded-full border border-reactor-primary/30 bg-reactor-primary/10 shadow-bloom">
                <Cpu className="size-5 text-reactor-primary" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold uppercase tracking-[0.2em] text-reactor-accent">
                  Arc Reactor OS
                </p>
                <p className="truncate text-xs text-reactor-muted">{mode.toUpperCase()} / {diagnostics.firmwareVersion}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="hidden items-center gap-2 rounded-full border border-reactor-secondary/[0.15] bg-white/[0.04] px-3 py-2 text-xs text-reactor-muted sm:flex">
                <BatteryCharging className="size-4 text-reactor-success" />
                {formatPercent(battery)}
              </div>
              <div className="hidden sm:block">
                <StatusPill connected={connected} transport={transport} />
              </div>
              <Button
                variant={connected ? "danger" : "primary"}
                size="sm"
                onClick={() => {
                  void (connected ? disconnect() : connect());
                }}
                disabled={connecting}
              >
                {connected ? <Power /> : <Bluetooth />}
                {connected ? "Disconnect" : connecting ? "Linking" : "Connect"}
              </Button>
            </div>
          </header>
        </div>

        <aside className="fixed inset-y-0 left-0 z-50 hidden w-24 border-r border-reactor-secondary/10 bg-black/[0.28] backdrop-blur-2xl lg:block">
          <div className="flex h-full flex-col items-center gap-4 py-5">
            <div className="grid size-12 place-items-center rounded-full border border-reactor-primary/[0.35] bg-reactor-primary/10 shadow-bloom">
              <Activity className={cn("size-6 text-reactor-primary", power && "animate-pulse")} />
            </div>
            <nav className="mt-4 flex flex-1 flex-col items-center gap-3">
              {navItems.map((item) => (
                <Tooltip key={item.to}>
                  <TooltipTrigger asChild>
                    <NavLink
                      to={item.to}
                      className={({ isActive }) =>
                        cn(
                          "grid size-11 place-items-center rounded-md border border-transparent text-reactor-muted transition",
                          "hover:border-reactor-secondary/25 hover:bg-white/[0.06] hover:text-reactor-accent",
                          isActive && "border-reactor-primary/40 bg-reactor-primary/[0.12] text-reactor-primary shadow-bloom",
                        )
                      }
                    >
                      <item.icon className="size-5" />
                    </NavLink>
                  </TooltipTrigger>
                  <TooltipContent side="right">{item.label}</TooltipContent>
                </Tooltip>
              ))}
            </nav>
          </div>
        </aside>

        <main className="px-4 pb-24 pt-24 md:px-6 lg:ml-24 lg:pb-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.32, ease: "easeOut" }}
              className="mx-auto max-w-[1680px]"
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>

        <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-reactor-secondary/[0.12] bg-reactor-bg/[0.82] px-2 py-2 backdrop-blur-2xl lg:hidden">
          <div className="grid grid-cols-6 gap-1">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  cn(
                    "grid min-h-12 place-items-center rounded-md text-reactor-muted transition",
                    isActive && "bg-reactor-primary/[0.12] text-reactor-primary shadow-bloom",
                  )
                }
                aria-label={item.label}
              >
                <item.icon className="size-5" />
              </NavLink>
            ))}
          </div>
        </nav>
      </div>
    </TooltipProvider>
  );
};
