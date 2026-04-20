"use client";

import { useState } from "react";
import { Download, Plus } from "lucide-react";
import { cn, exportProductsToCSV, exportSalesToCSV } from "@/lib/utils";
import type { Product, StockMovement } from "@/types";

interface ExportFABProps {
  readonly products: Product[];
  readonly todaySales: StockMovement[];
}

export function ExportFAB({ products, todaySales }: ExportFABProps) {
  const [showExportMenu, setShowExportMenu] = useState(false);

  return (
    <div className="fixed bottom-24 right-5 z-40">
      <div className="relative">
        {/* Expanded menu */}
        <div
          className={cn(
            "absolute bottom-full right-0 mb-4 flex flex-col gap-3 transition-all duration-300 transform origin-bottom items-end",
            showExportMenu
              ? "scale-100 opacity-100 translate-y-0"
              : "scale-0 opacity-0 translate-y-10",
          )}
        >
          <button
            onClick={() => {
              exportProductsToCSV(products);
              setShowExportMenu(false);
            }}
            className="flex items-center gap-3 px-5 py-4 bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xl hover:bg-white dark:hover:bg-slate-800 transition-all whitespace-nowrap group/btn"
          >
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-500 group-hover/btn:bg-blue-500 group-hover/btn:text-white transition-colors">
              <Download size={16} />
            </div>
            <div className="text-right">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider leading-none mb-1">
                Export
              </p>
              <p className="text-sm font-bold text-slate-700 dark:text-slate-200">
                Products CSV
              </p>
            </div>
          </button>

          <button
            onClick={() => {
              exportSalesToCSV(todaySales, "today-sales");
              setShowExportMenu(false);
            }}
            className="flex items-center gap-3 px-5 py-4 bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xl hover:bg-white dark:hover:bg-slate-800 transition-all whitespace-nowrap group/btn"
          >
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500 group-hover/btn:bg-emerald-500 group-hover/btn:text-white transition-colors">
              <Download size={16} />
            </div>
            <div className="text-right">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider leading-none mb-1">
                Export
              </p>
              <p className="text-sm font-bold text-slate-700 dark:text-slate-200">
                Sales CSV
              </p>
            </div>
          </button>
        </div>

        {/* Main Toggle Button */}
        <button
          onClick={() => setShowExportMenu(!showExportMenu)}
          className={cn(
            "w-14 h-14 rounded-2xl flex items-center justify-center shadow-2xl transition-all duration-300 group",
            showExportMenu
              ? "bg-slate-800 dark:bg-white text-white dark:text-slate-900 border-none"
              : "bg-indigo-600 text-white hover:bg-indigo-500 shadow-indigo-500/40 border border-white/20",
          )}
        >
          <div
            className={cn(
              "transition-transform duration-300",
              showExportMenu && "rotate-180",
            )}
          >
            {showExportMenu ? (
              <Plus className="rotate-45" size={24} />
            ) : (
              <Download size={24} />
            )}
          </div>
        </button>
      </div>
    </div>
  );
}
