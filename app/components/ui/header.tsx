"use client";
// components/ui/header.tsx

import { useAppStore } from "@/store/app-store";
import { Wifi, WifiOff, ArrowLeft, RefreshCcw, Home } from "lucide-react";
import { cn } from "@/lib/utils";
import { useQueryClient, useIsFetching } from "@tanstack/react-query";
import { toast } from "sonner";
import { useState } from "react";
import Link from "next/link";

interface HeaderProps {
  readonly title: string;
  readonly subtitle?: string;
  readonly onBack?: () => void;
  readonly action?: React.ReactNode;
}

export function Header({
  title,
  subtitle,
  onBack,
  action,
}: Readonly<HeaderProps>) {
  const { isOnline } = useAppStore();
  const queryClient = useQueryClient();
  const isFetching = useIsFetching();
  const [isReloading, setIsReloading] = useState(false);

  const handleReload = async () => {
    if (isReloading) return;

    setIsReloading(true);
    try {
      await queryClient.invalidateQueries();
      toast.success("Data refreshed");
    } catch (error) {
      toast.error("Failed to refresh data");
      console.error(error);
    } finally {
      setTimeout(() => setIsReloading(false), 500);
    }
  };

  const getSyncIcon = () => {
    if (isOnline) {
      return (
        <div className="relative flex items-center justify-center w-3 h-3">
          <span className="absolute inline-flex w-full h-full rounded-full opacity-60 bg-emerald-400 animate-ping" />
          <span className="relative inline-flex w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
        </div>
      );
    }
    return <WifiOff size={14} className="text-amber-500" />;
  };

  const getSyncLabel = () => {
    if (isOnline) {
      return "Online";
    }
    return "Offline";
  };

  return (
    <header className="sticky top-0 z-40 bg-white/70 dark:bg-slate-950/70 border-b border-black/5 dark:border-white/5 backdrop-blur-2xl shadow-sm px-4 safe-pt w-full transition-colors">
      <div className="flex items-center gap-4 py-3 border-t border-white/40 dark:border-white/5">
        {onBack && (
          <button
            onClick={onBack}
            className="w-10 h-10 flex items-center justify-center flex-shrink-0 rounded-2xl bg-white/60 dark:bg-slate-900/60 backdrop-blur-md border border-slate-200/50 dark:border-slate-800/50 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 active:scale-95 transition-all shadow-sm group"
          >
            <ArrowLeft
              size={20}
              className="group-hover:-translate-x-0.5 transition-transform"
            />
          </button>
        )}
        <div className="min-w-0 flex-1 pl-1">
          <h1 className="text-xl font-black dark:text-slate-100 text-slate-800 truncate leading-tight tracking-tight">
            {title}
          </h1>
          {subtitle && (
            <p className="text-[10px] font-bold uppercase tracking-widest dark:text-slate-400/80 text-slate-500 truncate mt-0.5">
              {subtitle}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2.5">
          {/* Connection status */}
          <div
            className={cn(
              "flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-widest border shadow-sm backdrop-blur-md transition-all",
              isOnline
                ? "border-emerald-500/20 bg-emerald-500/5 text-emerald-600 dark:text-emerald-400"
                : "border-amber-500/20 bg-amber-500/10 text-amber-600 dark:text-amber-400",
            )}
          >
            {getSyncIcon()}
            <span className="hidden md:inline">{getSyncLabel()}</span>
          </div>

          <button
            onClick={handleReload}
            disabled={isReloading || isFetching > 0}
            className={cn(
              "w-10 h-10 flex items-center justify-center rounded-2xl border shadow-sm backdrop-blur-md transition-all active:scale-95 flex-shrink-0 group",
              "border-slate-200/50 bg-white/60 text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800",
              "dark:border-slate-800/50 dark:bg-slate-900/60 dark:text-slate-400",
              isReloading || isFetching > 0
                ? "cursor-not-allowed opacity-70"
                : "cursor-pointer",
            )}
            title="Reload data"
          >
            <RefreshCcw
              size={18}
              className={cn(
                "transition-transform",
                isReloading || isFetching > 0
                  ? "animate-spin text-indigo-500"
                  : "group-hover:-rotate-45",
              )}
            />
          </button>

          <Link
            href="/"
            className={cn(
              "w-10 h-10 flex items-center justify-center rounded-2xl border shadow-sm backdrop-blur-md transition-all active:scale-95 flex-shrink-0 group",
              "border-slate-200/50 bg-white/60 text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800",
              "dark:border-slate-800/50 dark:bg-slate-900/60 dark:text-slate-400",
            )}
            title="Home"
          >
            <Home
              size={18}
              className="transition-transform group-hover:scale-110"
            />
          </Link>

          {action}
        </div>
      </div>
    </header>
  );
}
