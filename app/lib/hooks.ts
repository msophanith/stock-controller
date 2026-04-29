// lib/hooks.ts
import { useState, useEffect, useRef, useCallback } from "react";

/**
 * Returns a debounced version of the input value.
 * The debounced value will only update after the specified delay has passed
 * since the last change to the input value.
 */
export function useDebounce<T>(value: T, delayMs: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delayMs);

    return () => clearTimeout(timer);
  }, [value, delayMs]);

  return debouncedValue;
}

/**
 * Listens for physical barcode scanner input (USB/Bluetooth).
 *
 * How it works:
 * Physical barcode scanners emulate a keyboard — they "type" the barcode
 * characters very rapidly (faster than any human can type), then press Enter.
 *
 * This hook detects that pattern by:
 * 1. Accumulating keystrokes that arrive within a short time window (< 50ms apart)
 * 2. On Enter or after a brief idle timeout, checking if the accumulated string
 *    looks like a barcode (fast input, reasonable length)
 * 3. Skipping input when the user is focused on a text field (so it doesn't
 *    interfere with normal typing)
 *
 * @param onScan - callback fired with the scanned barcode string
 * @param options.enabled - set to false to disable listening (default: true)
 * @param options.minLength - minimum barcode length to accept (default: 4)
 * @param options.maxKeystrokeGapMs - max ms between keystrokes to be considered scanner input (default: 50)
 */
export function useBarcodeScannerListener(
  onScan: (barcode: string) => void,
  options?: {
    enabled?: boolean;
    minLength?: number;
    maxKeystrokeGapMs?: number;
  },
) {
  const {
    enabled = true,
    minLength = 4,
    maxKeystrokeGapMs = 50,
  } = options ?? {};

  const bufferRef = useRef<string>("");
  const lastKeystrokeRef = useRef<number>(0);
  const flushTimerRef = useRef<ReturnType<typeof setTimeout>>();
  const onScanRef = useRef(onScan);

  // Keep callback ref up-to-date without causing re-subscriptions
  useEffect(() => {
    onScanRef.current = onScan;
  }, [onScan]);

  const flush = useCallback(() => {
    const barcode = bufferRef.current.trim();
    bufferRef.current = "";

    if (barcode.length >= minLength) {
      onScanRef.current(barcode);
    }
  }, [minLength]);

  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept if user is typing in an input/textarea/select
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") {
        return;
      }

      // Don't intercept modifier key combos (Ctrl+C, etc.)
      if (e.ctrlKey || e.metaKey || e.altKey) {
        return;
      }

      const now = Date.now();
      const gap = now - lastKeystrokeRef.current;
      lastKeystrokeRef.current = now;

      // If too much time has passed since last keystroke, start fresh
      if (gap > maxKeystrokeGapMs && bufferRef.current.length > 0) {
        bufferRef.current = "";
      }

      // Check if this looks like a scanner (fast typing)
      if (gap <= maxKeystrokeGapMs) {
        (window as any).__isScannerActive = true;
        clearTimeout((window as any).__scannerTimeout);
        (window as any).__scannerTimeout = setTimeout(() => {
          (window as any).__isScannerActive = false;
        }, 100);
      }

      // Enter key = scanner finished sending barcode
      if (e.key === "Enter") {
        e.preventDefault();
        e.stopImmediatePropagation();
        clearTimeout(flushTimerRef.current);
        flush();
        return;
      }

      // Only accept printable characters (single char keys)
      if (e.key.length === 1) {
        bufferRef.current += e.key;

        // Reset the flush timer — if scanner pauses for a moment, we flush
        clearTimeout(flushTimerRef.current);
        flushTimerRef.current = setTimeout(() => {
          flush();
        }, 100);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      clearTimeout(flushTimerRef.current);
    };
  }, [enabled, maxKeystrokeGapMs, flush]);
}

/**
 * Returns true if the component has mounted on the client.
 * Use this to avoid hydration mismatches for state that is client-only (like localStorage stores).
 */
export function useHasMounted() {
  const [hasMounted, setHasMounted] = useState(false);
  useEffect(() => {
    setHasMounted(true);
  }, []);
  return hasMounted;
}
