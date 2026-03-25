"use client";
// components/ui/header.tsx

import { useAppStore } from "@/store/app-store";
import { Wifi, WifiOff } from "lucide-react";
import { cn } from "@/lib/utils";

interface HeaderProps {
  readonly title: string;
  readonly subtitle?: string;
  readonly action?: React.ReactNode;
}

export function Header({ title, subtitle, action }: Readonly<HeaderProps>) {
  const { isOnline } = useAppStore();

  const getSyncIcon = () => {
    if (isOnline) {
      return <Wifi size={14} className="text-emerald-400" />;
    }
    return <WifiOff size={14} className="text-amber-400" />;
  };

  const getSyncLabel = () => {
    if (isOnline) {
      return "Connected";
    }
    return "Offline";
  };

  return (
    <header className="sticky top-0 z-40 dark:bg-slate-950/90 dark:border-slate-800/60 bg-white/90 border-slate-200/60 backdrop-blur-xl border-b px-4 pt-safe-pt">
      <div className="flex items-center justify-between py-3">
        <div className="min-w-0 flex-1">
          <h1 className="text-xl font-bold dark:text-slate-100 text-slate-900 truncate leading-tight">
            {title}
          </h1>
          {subtitle && (
            <p className="text-xs dark:text-slate-500 text-slate-600 truncate mt-0.5">
              {subtitle}
            </p>
          )}
        </div>

        <div className="flex items-center gap-3 ml-4">
          {/* Connection status */}
          <div
            className={cn(
              "flex items-center gap-2 px-2.5 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider border shadow-sm",
              isOnline
                ? "border-emerald-500/20 bg-emerald-500/5 text-emerald-500/80"
                : "border-amber-500/20 bg-amber-500/5 text-amber-500/80",
            )}
          >
            {getSyncIcon()}
            <span className="hidden xs:inline">{getSyncLabel()}</span>
          </div>

          {action}
        </div>
      </div>
    </header>
  );
}
