"use client";

import { Search, X, Filter } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProductSearchBarProps {
  readonly search: string;
  readonly setSearch: (val: string) => void;
  readonly showFilters: boolean;
  readonly setShowFilters: (val: boolean | ((v: boolean) => boolean)) => void;
  readonly stockFilter: string;
  readonly setStockFilter: (val: string) => void;
  readonly hasActiveFilters: boolean;
}

const FILTERS = [
  { value: "all", label: "All" },
  { value: "low", label: "Low Stock" },
  { value: "out", label: "Out of Stock" },
  { value: "ok", label: "In Stock" },
];

export function ProductSearchBar({
  search,
  setSearch,
  showFilters,
  setShowFilters,
  stockFilter,
  setStockFilter,
  hasActiveFilters,
}: ProductSearchBarProps) {
  return (
    <div className="px-4 py-3 space-y-2">
      {/* Search */}
      <div className="relative">
        <Search
          size={16}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
        />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search products, barcode, shelf…"
          className="input-field pl-9 pr-9"
        />
        {search && (
          <button
            onClick={() => setSearch("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* Filter & Sort toggles */}
      <div className="flex items-center gap-2 overflow-x-auto pb-0.5 scrollbar-hide">
        <button
          onClick={() => setShowFilters((v) => !v)}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border flex-shrink-0 transition-all",
            showFilters || hasActiveFilters
              ? "bg-orange-500/20 border-orange-500/40 text-orange-400"
              : "bg-slate-200 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-400 dark:hover:border-slate-600",
          )}
        >
          <Filter size={12} />
          Filters
          {hasActiveFilters && (
            <span className="bg-orange-500 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center">
              !
            </span>
          )}
        </button>

        {FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setStockFilter(f.value)}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-medium border flex-shrink-0 transition-all",
              stockFilter === f.value
                ? "bg-orange-500/20 border-orange-500/40 text-orange-400"
                : "bg-slate-200 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-400 dark:hover:border-slate-600",
            )}
          >
            {f.label}
          </button>
        ))}
      </div>
    </div>
  );
}
