"use client";

import { Usb, ScanLine, Keyboard } from "lucide-react";
import { BarcodeInput } from "@/components/scanner/barcode-scanner";

type ScanMode = "camera" | "keyboard" | "hardware";

interface ScannerAreaProps {
  scanMode: ScanMode;
  isSearching: boolean;
  onScan: (barcode: string) => void;
  onSwitchToCamera: () => void;
}

export function ScannerArea({
  scanMode,
  isSearching,
  onScan,
  onSwitchToCamera,
}: ScannerAreaProps) {
  return (
    <div className="card p-5 bg-white/40 dark:bg-slate-900/40 backdrop-blur-md border-slate-200/50 dark:border-slate-800/50 shadow-xl shadow-slate-200/20 dark:shadow-black/20 overflow-hidden relative group">
      {/* Decorative background element */}
      <div className="absolute -right-4 -top-4 w-24 h-24 bg-orange-500/5 rounded-full blur-2xl group-hover:bg-orange-500/10 transition-colors duration-500" />

      {scanMode === "keyboard" ? (
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500">
              <Keyboard size={16} />
            </div>
            <p className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-tight">
              Manual Entry
            </p>
          </div>
          <BarcodeInput onSubmit={onScan} />
        </div>
      ) : (
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="absolute inset-0 bg-orange-500/20 rounded-2xl blur-lg animate-pulse" />
                <div className="relative w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white shadow-lg shadow-orange-500/30">
                  <Usb size={24} />
                </div>
              </div>
              <div>
                <p className="text-base font-black text-slate-900 dark:text-slate-50 tracking-tight">
                  Scanner Active
                </p>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <p className="text-xs text-slate-500 font-medium">
                    Ready to scan barcodes
                  </p>
                </div>
              </div>
            </div>
            <button
              onClick={onSwitchToCamera}
              className="btn-secondary py-2.5 px-4 text-xs font-bold gap-2 rounded-xl border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all active:scale-95"
            >
              <ScanLine size={14} className="text-orange-500" />
              Camera
            </button>
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-slate-800/50">
            <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-3">
              Quick Manual Search
            </p>
            <BarcodeInput onSubmit={onScan} />
          </div>
        </div>
      )}

      {isSearching && (
        <div className="absolute inset-0 bg-white/60 dark:bg-slate-900/60 backdrop-blur-[2px] flex items-center justify-center z-10 animate-in fade-in duration-300">
          <div className="bg-white dark:bg-slate-800 p-3 rounded-2xl shadow-2xl flex items-center gap-3 border border-slate-100 dark:border-slate-700">
            <div className="w-5 h-5 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
              Finding Product...
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
