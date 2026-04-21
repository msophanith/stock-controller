"use client";
// components/scanner/barcode-scanner.tsx

import { useCallback, useMemo, useRef, useState } from "react";
import {
  BarcodeScanner as RBSScanner,
  type DetectedBarcode,
  useTorch,
} from "react-barcode-scanner";
import "react-barcode-scanner/polyfill";
import { X, Flashlight, Camera, Check, Clock, ArrowLeft } from "lucide-react";

// --- Patch BarcodeDetector to prevent InvalidStateError crashes ---
if (globalThis.window !== undefined) {
  const globalAny = globalThis as any;
  const originalDetect = globalAny.BarcodeDetector?.prototype?.detect;
  if (originalDetect) {
    globalAny.BarcodeDetector.prototype.detect = function (source: any) {
      try {
        return originalDetect.call(this, source).catch((err: any) => {
          if (
            err.name === "InvalidStateError" ||
            err.message?.includes("Invalid element or state")
          ) {
            return [];
          }
          throw err;
        });
      } catch (err: any) {
        if (err.name === "InvalidStateError") return Promise.resolve([]);
        throw err;
      }
    };
  }
}

import { cn } from "@/lib/utils";
import { useAppStore } from "@/store/app-store";

interface BarcodeScannerProps {
  readonly onScan: (barcode: string) => void;
  readonly onClose?: () => void;
  readonly onBack?: () => void;
  readonly className?: string;
  readonly fullScreen?: boolean;
}

export function BarcodeScanner({
  onScan,
  onClose,
  onBack,
  className,
  fullScreen = false,
}: Readonly<BarcodeScannerProps>) {
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paused, setPaused] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  const lastScanRef = useRef<string>("");
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  const { isTorchOn, setIsTorchOn, isTorchSupported } = useTorch(false);
  const { barcodeHistory, addBarcodeToHistory, clearBarcodeHistory } =
    useAppStore();

  // Memoize stable objects to prevent the library from restarting the camera on every render
  const trackConstraints = useMemo<MediaTrackConstraints>(
    () => ({
      facingMode: "environment",
    }),
    [],
  );

  const scanOptions = useMemo(
    () => ({
      delay: 300,
      formats: [
        "qr_code",
        "ean_13",
        "ean_8",
        "code_128",
        "code_39",
        "upc_a",
        "upc_e",
        "itf",
      ],
    }),
    [],
  );

  const handleCapture = useCallback(
    (barcodes: DetectedBarcode[]) => {
      if (barcodes.length === 0) return;

      const barcode = barcodes[0];
      const value = barcode.rawValue;

      if (!value || value === lastScanRef.current) return;
      lastScanRef.current = value;

      // Debounce rapid scans
      clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        lastScanRef.current = "";
      }, 2000);

      // Add to history
      addBarcodeToHistory(value);

      // Haptic feedback
      if ("vibrate" in navigator) navigator.vibrate(80);

      onScan(value);
    },
    [onScan, addBarcodeToHistory],
  );

  const handleError = useCallback((err: unknown) => {
    const errorMsg = (err as Error)?.message || String(err);
    if (errorMsg.toLowerCase().includes("permission")) {
      setError("Camera access denied. Please check permissions.");
    } else if (
      errorMsg.toLowerCase().includes("not found") ||
      errorMsg.toLowerCase().includes("notfounderror")
    ) {
      setError("No camera found. Please check your device.");
    } else {
      setError("Camera unavailable. Please reload and try again.");
    }
  }, []);

  if (error) {
    return (
      <div
        className={cn(
          "flex flex-col items-center justify-center gap-4 p-8 text-center",
          "dark:text-slate-600 text-slate-400",
          fullScreen && "fixed inset-0 z-50 bg-transparent",
          className,
        )}
      >
        <Camera size={48} className="dark:text-slate-600 text-slate-400" />
        <div>
          <p className="dark:text-slate-300 text-slate-700 font-medium">
            {error}
          </p>
          <p className="dark:text-slate-500 text-slate-500 text-sm mt-1">
            Allow camera access in your browser settings, then reload.
          </p>
        </div>
        {onClose && (
          <button onClick={onClose} className="btn-secondary">
            Close
          </button>
        )}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "relative w-full flex flex-col",
        fullScreen && "fixed inset-0 z-[100] bg-black overflow-hidden",
        className,
      )}
    >
      {/* Scanner viewport */}
      <div
        className={cn(
          "relative overflow-hidden transition-all duration-300",
          fullScreen
            ? "flex-1 h-full w-full"
            : "w-full aspect-[4/3] sm:aspect-video rounded-[2rem] bg-slate-950 border border-slate-800/50 shadow-2xl",
        )}
      >
        {/* 1. Camera Feed Layer */}
        <div className="absolute inset-0 z-0 bg-black flex items-center justify-center overflow-hidden">
          <RBSScanner
            paused={paused}
            trackConstraints={trackConstraints}
            options={scanOptions}
            onCapture={handleCapture}
            onPlay={() => setIsCameraReady(true)}
            onError={handleError}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />

          {!isCameraReady && !error && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-slate-950">
              <div className="w-10 h-10 border-2 border-orange-500/30 border-t-orange-500 rounded-full animate-spin" />
              <p className="text-xs text-slate-500 font-medium">
                Starting camera...
              </p>
            </div>
          )}
        </div>

        {/* 2. Custom Scanner Overlay Layer */}
        {isCameraReady && (
          <div className="absolute inset-0 pointer-events-none z-10 flex flex-col">
            {/* Top dark area */}
            <div className="flex-1 bg-black/60 backdrop-blur-[2px]" />

            {/* Middle scanning row */}
            <div className="flex h-[260px] sm:h-[300px]">
              <div className="flex-1 bg-black/60 backdrop-blur-[2px]" />
              {/* Target square */}
              <div className="relative w-[260px] sm:w-[300px] bg-transparent">
                {/* Targeting Corners */}
                <div className="absolute -top-1 -left-1 w-10 h-10 border-t-4 border-l-4 border-orange-500 rounded-tl-2xl" />
                <div className="absolute -top-1 -right-1 w-10 h-10 border-t-4 border-r-4 border-orange-500 rounded-tr-2xl" />
                <div className="absolute -bottom-1 -left-1 w-10 h-10 border-b-4 border-l-4 border-orange-500 rounded-bl-2xl" />
                <div className="absolute -bottom-1 -right-1 w-10 h-10 border-b-4 border-r-4 border-orange-500 rounded-br-2xl" />

                {/* Laser scan line */}
                <div className="absolute left-6 right-6 h-0.5 bg-orange-500 shadow-[0_0_15px_#f97316] animate-scan-line-slow top-0" />
              </div>
              <div className="flex-1 bg-black/60 backdrop-blur-[2px]" />
            </div>

            {/* Bottom dark area */}
            <div className="flex-1 bg-black/60 backdrop-blur-[2px] flex flex-col items-center pt-8">
              <div className="px-5 py-2.5 rounded-full bg-black/40 backdrop-blur-xl border border-white/10 flex items-center gap-2 shadow-2xl">
                <Camera size={16} className="text-orange-400" />
                <p className="text-white text-sm font-semibold tracking-wide">
                  Align barcode within frame
                </p>
              </div>
            </div>
          </div>
        )}

        {/* --- UI Controls Layer --- */}
        {fullScreen && (
          <div className="absolute top-0 left-0 right-0 p-6 safe-pt flex items-center justify-between z-[60]">
            <div className="flex items-center gap-3">
              {onBack && (
                <button
                  onClick={onBack}
                  className="w-12 h-12 rounded-2xl flex items-center justify-center bg-black/40 border border-white/10 text-white backdrop-blur-xl active:scale-90 transition-all shadow-2xl"
                >
                  <ArrowLeft size={24} />
                </button>
              )}
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-500/10 border border-red-500/20 backdrop-blur-md">
                <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                <span className="text-red-400 text-[10px] font-black uppercase tracking-widest">
                  Live
                </span>
              </div>
            </div>
            {onClose && (
              <button
                onClick={onClose}
                className="w-12 h-12 rounded-2xl flex items-center justify-center bg-black/40 border border-white/10 text-white backdrop-blur-xl active:scale-90 transition-all shadow-2xl"
              >
                <X size={24} />
              </button>
            )}
          </div>
        )}

        {/* Bottom Floating Controls */}
        <div
          className={cn(
            "absolute flex gap-3 z-[60]",
            fullScreen
              ? "bottom-10 left-1/2 -translate-x-1/2 p-2 px-4 rounded-3xl bg-black/60 backdrop-blur-xl border border-white/10 shadow-2xl"
              : "bottom-3 right-3",
          )}
        >
          <button
            onClick={() => setShowHistory(!showHistory)}
            className={cn(
              "w-12 h-12 rounded-2xl flex items-center justify-center transition-all",
              showHistory
                ? "bg-blue-500 text-white shadow-lg"
                : "bg-white/10 text-white hover:bg-white/20",
            )}
          >
            <Clock size={20} />
          </button>

          {isTorchSupported && (
            <button
              onClick={() => setIsTorchOn(!isTorchOn)}
              className={cn(
                "w-12 h-12 rounded-2xl flex items-center justify-center transition-all",
                isTorchOn
                  ? "bg-amber-500 text-white shadow-lg"
                  : "bg-white/10 text-white hover:bg-white/20",
              )}
            >
              <Flashlight size={20} />
            </button>
          )}

          {fullScreen && (
            <button
              onClick={() => setPaused((p) => !p)}
              className={cn(
                "w-12 h-12 rounded-2xl flex items-center justify-center transition-all",
                paused
                  ? "bg-orange-500 text-white shadow-lg"
                  : "bg-white/10 text-white hover:bg-white/20",
              )}
            >
              <Camera size={20} />
            </button>
          )}
        </div>

        {/* Custom History Popup */}
        {showHistory && (
          <div className="absolute inset-0 bg-slate-950/95 backdrop-blur-xl flex flex-col z-[70] p-6 pt-20 animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="font-bold text-white text-xl">Recent Scans</h3>
                <p className="text-xs text-slate-500 uppercase tracking-wider mt-1">
                  Session History
                </p>
              </div>
              <button
                onClick={() => setShowHistory(false)}
                className="w-10 h-10 rounded-xl flex items-center justify-center bg-white/5 text-slate-400 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>

            {barcodeHistory.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-slate-600">
                <div className="w-16 h-16 rounded-3xl bg-white/5 flex items-center justify-center mb-4">
                  <Clock size={32} />
                </div>
                <p className="font-medium">No barcodes found yet</p>
              </div>
            ) : (
              <>
                <div className="flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-none">
                  {barcodeHistory.map((barcode, idx) => (
                    <button
                      key={`${barcode}-${idx}`}
                      onClick={() => {
                        onScan(barcode);
                        setShowHistory(false);
                      }}
                      className="w-full group flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/10 transition-all"
                    >
                      <span className="font-mono text-sm text-orange-400 font-bold">
                        {barcode}
                      </span>
                      <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center group-hover:bg-orange-500 group-hover:text-white transition-colors">
                        <Check size={14} />
                      </div>
                    </button>
                  ))}
                </div>
                <button
                  onClick={clearBarcodeHistory}
                  className="w-full py-4 mt-6 rounded-2xl bg-white/5 text-slate-400 text-sm font-bold hover:text-red-400 hover:bg-red-500/10 transition-all border border-white/5"
                >
                  Clear History
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {!fullScreen && (
        <p className="text-center text-xs dark:text-slate-500 text-slate-600 font-medium uppercase tracking-widest mt-4">
          Scanning Active
        </p>
      )}
    </div>
  );
}

// ─── Inline barcode input fallback ───────────────────────────────────────────

interface BarcodeInputProps {
  readonly onSubmit: (barcode: string) => void;
  readonly placeholder?: string;
}

export function BarcodeInput({
  onSubmit,
  placeholder = "Enter barcode…",
}: Readonly<BarcodeInputProps>) {
  const [value, setValue] = useState("");
  const [showHistory, setShowHistory] = useState(false);
  const { barcodeHistory, addBarcodeToHistory, clearBarcodeHistory } =
    useAppStore();

  const handleSubmit = (barcode: string) => {
    if (barcode.trim()) {
      addBarcodeToHistory(barcode.trim());
      onSubmit(barcode.trim());
      setValue("");
    }
  };

  return (
    <div className="space-y-3">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSubmit(value);
        }}
        className="flex gap-2"
      >
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={placeholder}
          className="input-field flex-1"
          autoComplete="off"
          inputMode="numeric"
        />
        <button type="submit" className="btn-primary px-4">
          Go
        </button>
      </form>

      {/* Barcode history in keyboard mode */}
      {barcodeHistory.length > 0 && (
        <div>
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="w-full text-xs font-medium text-slate-500 hover:text-slate-400 py-2 px-3 rounded-lg border border-slate-700 hover:border-slate-600 transition-colors"
          >
            <Clock size={14} className="inline mr-1" />
            {barcodeHistory.length} Recent Scans
          </button>

          {showHistory && (
            <div className="mt-2 space-y-1 max-h-40 overflow-y-auto">
              {barcodeHistory.map((barcode) => (
                <button
                  key={barcode}
                  onClick={() => {
                    handleSubmit(barcode);
                    setShowHistory(false);
                  }}
                  className="w-full text-left p-2 rounded-lg bg-slate-800/50 hover:bg-slate-700 font-mono text-xs text-orange-300 transition-colors"
                >
                  {barcode}
                </button>
              ))}
              <button
                onClick={clearBarcodeHistory}
                className="w-full text-xs text-slate-500 hover:text-slate-400 py-2 mt-2"
              >
                Clear history
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
