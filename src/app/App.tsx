import { Navigate, Route, BrowserRouter as Router, Routes } from "react-router-dom";
import { lazy, Suspense } from "react";

import { AppShell } from "@/components/layouts/AppShell";
import { Splash } from "@/pages/Splash";
import { useAutoConnect } from "@/hooks/useAutoConnect";

const Dashboard = lazy(() => import("@/pages/Dashboard").then((module) => ({ default: module.Dashboard })));
const Controls = lazy(() => import("@/pages/Controls").then((module) => ({ default: module.Controls })));
const Modes = lazy(() => import("@/pages/Modes").then((module) => ({ default: module.Modes })));
const Diagnostics = lazy(() => import("@/pages/Diagnostics").then((module) => ({ default: module.Diagnostics })));
const DeveloperConsole = lazy(() =>
  import("@/pages/DeveloperConsole").then((module) => ({ default: module.DeveloperConsole })),
);
const Settings = lazy(() => import("@/pages/Settings").then((module) => ({ default: module.Settings })));

const RoutedShell = (): JSX.Element => {
  useAutoConnect();

  return <AppShell />;
};

const RouteLoader = (): JSX.Element => (
  <div className="grid min-h-[60vh] place-items-center">
    <div className="size-16 rounded-full border border-reactor-primary/30 bg-reactor-primary/10 shadow-bloom" />
  </div>
);

const routerBasename = import.meta.env.BASE_URL === "/" ? undefined : import.meta.env.BASE_URL.replace(/\/$/, "");

const AppRoutes = (): JSX.Element => (
  <Suspense fallback={<RouteLoader />}>
    <Routes>
      <Route path="/" element={<Splash />} />
      <Route element={<RoutedShell />}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/controls" element={<Controls />} />
        <Route path="/modes" element={<Modes />} />
        <Route path="/diagnostics" element={<Diagnostics />} />
        <Route path="/console" element={<DeveloperConsole />} />
        <Route path="/settings" element={<Settings />} />
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  </Suspense>
);

export const App = (): JSX.Element =>
  routerBasename ? (
    <Router basename={routerBasename}>
      <AppRoutes />
    </Router>
  ) : (
    <Router>
      <AppRoutes />
    </Router>
  );
