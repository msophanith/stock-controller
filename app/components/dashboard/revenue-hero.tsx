"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Eye,
  EyeOff,
  TrendingUp,
  RotateCcw,
  ScanLine,
  Plus,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface RevenueHeroProps {
  readonly todayStats: {
    readonly salesCount: number;
    readonly returnsCount: number;
    readonly totalRevenue: number;
    readonly totalReturnAmount: number;
  };
}

export function RevenueHero({ todayStats }: RevenueHeroProps) {
  const [showAmount, setShowAmount] = useState(false);

  return (
    <div className="card p-6 md:p-8 bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-pink-500/10 dark:from-indigo-500/20 dark:via-purple-500/10 dark:to-pink-500/20 border-indigo-500/20 shadow-xl shadow-indigo-500/5 relative overflow-hidden group">
      <div className="absolute -top-20 -right-20 w-48 h-48 bg-indigo-500/20 rounded-full blur-3xl transition-transform duration-700 group-hover:scale-150" />
      <div className="absolute -bottom-20 -left-20 w-48 h-48 bg-pink-500/20 rounded-full blur-3xl transition-transform duration-700 group-hover:scale-150" />

      <div className="relative z-10">
        <div className="mb-2">
          <h2 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest pl-1">
            Today's Revenue
          </h2>
        </div>
        <div className="flex items-center gap-3 mb-1">
          <span className="text-4xl md:text-5xl font-black font-price tracking-tight bg-gradient-to-r from-indigo-600 to-pink-500 dark:from-indigo-400 dark:to-pink-400 bg-clip-text text-transparent transition-all duration-300">
            {showAmount ? formatCurrency(todayStats.totalRevenue) : "$******"}
          </span>
          <button
            onClick={() => setShowAmount(!showAmount)}
            className="p-2 text-slate-400 hover:text-indigo-500 dark:hover:text-indigo-400 hover:bg-slate-200/50 dark:hover:bg-slate-800/50 rounded-full transition-all flex-shrink-0 mt-1"
            title={showAmount ? "Hide amount" : "Show amount"}
          >
            {showAmount ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        </div>
        <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 pl-1 mb-6 flex flex-wrap items-center gap-y-1 gap-x-3">
          <span className="flex items-center gap-1.5">
            <TrendingUp
              size={14}
              className="text-indigo-500 dark:text-indigo-400"
            />
            <span>
              <span className="text-indigo-500 dark:text-indigo-400 font-bold text-lg">
                {todayStats.salesCount}{" "}
              </span>
              sale
              {todayStats.salesCount !== 1 ? "s" : ""} today
            </span>
          </span>

          {todayStats.returnsCount > 0 && (
            <span className="flex items-center gap-1.5 border-l border-slate-300 dark:border-slate-700 pl-3">
              <RotateCcw
                size={14}
                className="text-amber-500 dark:text-amber-400"
              />
              <div className="flex flex-col sm:flex-row sm:items-baseline sm:gap-2">
                <span className="flex items-baseline gap-1">
                  <span className="text-amber-500 dark:text-amber-400 font-bold text-lg">
                    {todayStats.returnsCount}{" "}
                  </span>
                  <span className="text-xs">
                    return
                    {todayStats.returnsCount !== 1 ? "s" : ""}
                  </span>
                </span>
                <span className="text-[10px] sm:text-xs font-bold text-amber-600/80 dark:text-amber-400/80 bg-amber-500/10 px-1.5 py-0.5 rounded-md">
                  {showAmount
                    ? formatCurrency(todayStats.totalReturnAmount)
                    : "$***"}
                </span>
              </div>
            </span>
          )}
        </p>

        <div className="flex flex-col sm:flex-row gap-3">
          <Link
            href="/scan"
            className="btn-primary flex-1 py-4 text-base shadow-indigo-500/25 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 active:from-indigo-700 active:to-purple-800"
          >
            <ScanLine size={20} />
            Quick Scan
          </Link>
          <Link
            href="/scan?action=return"
            className="btn-secondary flex-1 py-4 text-base border-amber-500/20 bg-amber-500/5 hover:bg-amber-500/10 text-amber-600 dark:text-amber-400"
          >
            <RotateCcw size={20} />
            Return Product
          </Link>
          <Link
            href="/products/new"
            className="btn-secondary flex-1 py-4 text-base border-slate-200/60 dark:border-slate-700/60 shadow-sm backdrop-blur-xl"
          >
            <Plus size={20} />
            Add Item
          </Link>
        </div>
      </div>
    </div>
  );
}
