import { useEffect, useRef } from "react";

import { useBleController } from "@/hooks/useBleController";
import { useReactorStore } from "@/store/useReactorStore";

export const useAutoConnect = (): void => {
  const attempted = useRef(false);
  const settings = useReactorStore((state) => state.settings);
  const connected = useReactorStore((state) => state.connected);
  const { connect } = useBleController();

  useEffect(() => {
    if (!settings.autoConnect || connected || attempted.current) {
      return;
    }

    attempted.current = true;
    void connect();
  }, [connect, connected, settings.autoConnect]);
};
