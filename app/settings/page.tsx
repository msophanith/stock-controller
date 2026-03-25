"use client";
// app/settings/page.tsx

import { Wifi, WifiOff, Palette } from "lucide-react";
import { Header } from "@/components/ui/header";
import { BottomNav } from "@/components/ui/bottom-nav";
import { useAppStore } from "@/store/app-store";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/theme-provider";

export default function SettingsPage() {
  const { isOnline, scannerEnabled, setScannerEnabled } = useAppStore();

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950">
      <Header title="Settings" subtitle="App configuration" />

      <main className="px-4 pb-28 pt-4 space-y-6 page-enter">
        {/* Appearance */}
        <section className="card p-4 space-y-3">
          <h2 className="text-sm font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
            Appearance
          </h2>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-500">
                <Palette size={18} />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-900 dark:text-slate-200">
                  Theme Mode
                </p>
                <p className="text-xs text-slate-600 dark:text-slate-500">
                  Switch between light and dark
                </p>
              </div>
            </div>
            <ThemeToggle />
          </div>
        </section>
        {/* Connection status */}
        <section className="card p-4 space-y-3">
          <h2 className="text-sm font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
            Connection Status
          </h2>

          <div className="flex items-center justify-between py-2">
            <div className="flex items-center gap-2">
              {isOnline ? (
                <Wifi size={18} className="text-emerald-400" />
              ) : (
                <WifiOff size={18} className="text-amber-400" />
              )}
              <div>
                <p className="text-sm font-medium text-slate-900 dark:text-slate-200">
                  {isOnline ? "Online" : "Offline"}
                </p>
                <p className="text-xs text-slate-600 dark:text-slate-500">
                  Connected to Supabase Cloud
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Scanner */}
        <section className="card p-4 space-y-3">
          <h2 className="text-sm font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
            Scanner
          </h2>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-900 dark:text-slate-200">
                Barcode Scanner
              </p>
              <p className="text-xs text-slate-600 dark:text-slate-500">
                Enable camera barcode scanning
              </p>
            </div>
            <button
              onClick={() => setScannerEnabled(!scannerEnabled)}
              className={cn(
                "relative w-12 h-6 rounded-full transition-colors duration-200",
                scannerEnabled
                  ? "bg-orange-500"
                  : "bg-slate-300 dark:bg-slate-700",
              )}
            >
              <span
                className={cn(
                  "absolute top-1 w-4 h-4 bg-white rounded-full transition-transform duration-200 shadow",
                  scannerEnabled ? "translate-x-7" : "translate-x-1",
                )}
              />
            </button>
          </div>
        </section>

        {/* About */}
        <section className="card p-4 space-y-2">
          <h2 className="text-sm font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-3">
            About
          </h2>
          {[
            { label: "App Version", value: "1.0.0" },
            { label: "Cloud Backend", value: "Supabase" },
            { label: "Framework", value: "Next.js 14 App Router" },
            { label: "Developer", value: "JAY" },
          ].map(({ label, value }) => (
            <div
              key={label}
              className="flex items-center justify-between py-1.5"
            >
              <span className="text-sm text-slate-600 dark:text-slate-400">
                {label}
              </span>
              <span className="text-sm font-medium text-slate-900 dark:text-slate-300">
                {value}
              </span>
            </div>
          ))}
        </section>
      </main>

      <BottomNav />
    </div>
  );
}
