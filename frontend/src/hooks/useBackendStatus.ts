import { useEffect, useState } from "react";
import { checkHealth } from "../api/client";

export function useBackendStatus(pollMs = 8000) {
  const [online, setOnline] = useState(false);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const check = async () => {
      const res = await checkHealth();
      if (!cancelled) {
        setOnline(res.ok);
        setChecked(true);
      }
    };
    check();
    const t = setInterval(check, pollMs);
    return () => {
      cancelled = true;
      clearInterval(t);
    };
  }, [pollMs]);

  return { online, checked };
}
