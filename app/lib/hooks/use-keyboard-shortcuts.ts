"use client";

import { useEffect } from "react";

type ShortcutHandler = (event: KeyboardEvent) => void;

interface ShortcutMap {
  [key: string]: ShortcutHandler;
}

/**
 * Hook to manage global or local keyboard shortcuts.
 */
export function useKeyboardShortcuts(
  shortcuts: ShortcutMap,
  enabled: boolean = true,
) {
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      // Ignore if typing in an input/textarea
      const activeElement = document.activeElement;
      const isInput =
        activeElement instanceof HTMLInputElement ||
        activeElement instanceof HTMLTextAreaElement ||
        (activeElement as HTMLElement)?.isContentEditable;

      if (isInput) {
        // Still allow 'Escape' to blur inputs
        if (event.key === "Escape") {
          (activeElement as HTMLElement).blur();
        }
        return;
      }

      const handler =
        shortcuts[event.key] || shortcuts[event.key.toUpperCase()];
      if (handler) {
        event.preventDefault();
        handler(event);
      }

      // Handle special combos like Cmd+K or Ctrl+K for search (stub)
      if ((event.metaKey || event.ctrlKey) && event.key === "k") {
        event.preventDefault();
        shortcuts["CMD_K"]?.(event);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [shortcuts, enabled]);
}
