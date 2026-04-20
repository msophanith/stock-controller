"use client";

import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

export interface StatCard {
  label: string;
  value: string;
  icon: LucideIcon;
  color: string;
  bg: string;
}

interface StatsGridProps {
  readonly cards: StatCard[];
}

export function StatsGrid({ cards }: StatsGridProps) {
  return (
    <div className="grid grid-cols-2 gap-4">
      {cards.map(({ label, value, icon: Icon, color, bg }) => (
        <div
          key={label}
          className={cn(
            "card p-5 group hover:scale-[1.03] hover:-translate-y-1 transition-all duration-300 relative overflow-hidden",
            bg,
          )}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-transparent dark:from-white/5 opacity-50 block" />
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div
                className={cn(
                  "w-10 h-10 rounded-2xl flex items-center justify-center bg-white/60 dark:bg-slate-900/60 backdrop-blur-md shadow-sm border border-black/5 dark:border-white/5",
                  color,
                )}
              >
                <Icon size={20} />
              </div>
            </div>
            <p
              className={cn(
                "text-2xl font-black font-price tracking-tight mb-0.5",
                color,
              )}
            >
              {value}
            </p>
            <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              {label}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
