"use client";

import { useRouter } from "next/navigation";
import { useKeyboardShortcuts } from "@/lib/hooks/use-keyboard-shortcuts";
import { audioManager } from "@/lib/audio-manager";

export function GlobalShortcuts() {
  const router = useRouter();

  useKeyboardShortcuts({
    // Navigation
    D: () => {
       audioManager.playInfo();
       router.push("/dashboard");
    },
    P: () => {
       audioManager.playInfo();
       router.push("/products");
    },
    S: () => {
       audioManager.playInfo();
       router.push("/scan");
    },
    H: () => {
       audioManager.playInfo();
       router.push("/history");
    },
  });

  return null;
}
