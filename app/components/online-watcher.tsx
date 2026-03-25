"use client";

import { useEffect, useCallback } from "react";
import { useAppStore } from "@/store/app-store";
import { supabase } from "@/lib/supabase";

export function OnlineWatcher() {
  const { setIsOnline } = useAppStore();

  const checkConnection = useCallback(async () => {
    // 1. Initial browser check
    if (!navigator.onLine) {
      setIsOnline(false);
      return;
    }

    // 2. Real server check (Supabase)
    try {
      // getSession() is a reliable check that doesn't depend on table existence
      const { error } = await supabase.auth.getSession();

      if (error) {
        // Check if error is network related (status 0 or message contains "fetch")
        // Note: Any valid response status from server means we are ONLINE
        if (
          error.status === 0 ||
          error.message.toLowerCase().includes("fetch")
        ) {
          setIsOnline(false);
        } else {
          setIsOnline(true);
        }
      } else {
        setIsOnline(true);
      }
    } catch (err) {
      console.error("Connectivity check failed:", err);
      setIsOnline(false);
    }
  }, [setIsOnline]);

  useEffect(() => {
    // Initial check
    checkConnection().catch((err) =>
      console.error("Initial check failed:", err),
    );

    // Event listeners for browser state
    const handleOnline = () => checkConnection();
    const handleOffline = () => setIsOnline(false);

    globalThis.addEventListener("online", handleOnline);
    globalThis.addEventListener("offline", handleOffline);
    globalThis.addEventListener("focus", handleOnline);

    // Periodic check (every 30 seconds)
    const interval = setInterval(checkConnection, 30000);

    return () => {
      globalThis.removeEventListener("online", handleOnline);
      globalThis.removeEventListener("offline", handleOffline);
      globalThis.removeEventListener("focus", handleOnline);
      clearInterval(interval);
    };
  }, [checkConnection, setIsOnline]);

  return null; // This component doesn't render anything
}
