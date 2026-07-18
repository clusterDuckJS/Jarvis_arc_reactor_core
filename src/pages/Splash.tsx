import { motion } from "framer-motion";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

import { ArcReactorCanvas } from "@/components/reactor/ArcReactorCanvas";
import { useReactorStore } from "@/store/useReactorStore";

export const Splash = (): JSX.Element => {
  const navigate = useNavigate();
  const reducedMotion = useReactorStore((state) => state.settings.reducedMotion);

  useEffect(() => {
    const timeout = window.setTimeout(() => navigate("/dashboard", { replace: true }), reducedMotion ? 1600 : 6400);
    return () => window.clearTimeout(timeout);
  }, [navigate, reducedMotion]);

  return (
    <main className="relative grid min-h-screen place-items-center overflow-hidden bg-black text-reactor-accent">
      <motion.div
        className="absolute size-2 rounded-full bg-reactor-primary shadow-bloom"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: [0, 1, 0.7, 2.8], opacity: [0, 1, 1, 0] }}
        transition={{ duration: reducedMotion ? 0.3 : 2.2, ease: "easeOut" }}
      />
      <motion.div
        className="absolute inset-0 bg-reactor-accent"
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 0, 0.82, 0] }}
        transition={{ delay: reducedMotion ? 0.4 : 3.2, duration: reducedMotion ? 0.4 : 0.9 }}
      />
      <motion.div
        initial={{ scale: 0.28, opacity: 0 }}
        animate={{ scale: [0.28, 0.54, 0.95, 1.08], opacity: [0, 0.55, 1, 1] }}
        transition={{ duration: reducedMotion ? 0.8 : 4.6, ease: "easeInOut" }}
        className="relative size-[min(82vw,560px)]"
      >
        <ArcReactorCanvas variant="splash" showHud={false} className="size-full min-h-0" />
        {[0, 1, 2].map((ring) => (
          <motion.span
            key={ring}
            className="pointer-events-none absolute inset-1/2 size-24 -translate-x-1/2 -translate-y-1/2 rounded-full border border-reactor-primary/30"
            initial={{ scale: 0.3, opacity: 0 }}
            animate={{ scale: [0.3, 2.8 + ring * 0.52], opacity: [0, 0.5, 0] }}
            transition={{
              delay: reducedMotion ? 0.2 : 2.2 + ring * 0.28,
              duration: reducedMotion ? 0.6 : 2.6,
              ease: "easeOut",
            }}
          />
        ))}
      </motion.div>
      <motion.div
        className="absolute bottom-[18vh] text-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: [0, 0, 1, 0], y: [20, 20, 0, -12] }}
        transition={{ delay: reducedMotion ? 0.4 : 3.8, duration: reducedMotion ? 1 : 2.4 }}
      >
        <p className="text-xs font-semibold uppercase tracking-[0.46em] text-reactor-primary/80">Stark Industries</p>
        <h1 className="mt-4 text-3xl font-semibold tracking-normal text-bloom md:text-6xl">ARC REACTOR OS</h1>
      </motion.div>
    </main>
  );
};
