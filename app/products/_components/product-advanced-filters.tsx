"use client";

import { Download } from "lucide-react";
import { cn, PRODUCT_CATEGORIES, exportProductsToCSV } from "@/lib/utils";
import type { Product } from "@/types";

interface ProductAdvancedFiltersProps {
  readonly showFilters: boolean;
  readonly categoryFilter: string;
  readonly setCategoryFilter: (val: string) => void;
  readonly showAdvancedFilters: boolean;
  readonly setShowAdvancedFilters: (val: boolean) => void;
  readonly sortBy: string;
  readonly setSortBy: (val: string) => void;
  readonly priceRange: { min: number; max: number } | null;
  readonly setPriceRange: (val: { min: number; max: number } | null) => void;
  readonly filteredProducts: Product[];
  readonly stats: { totalValue: number; avgMargin: string };
  readonly clearFilters: () => void;
  readonly hasActiveFilters: boolean;
}

const SORT_OPTIONS = [
  { value: "recent", label: "Recently Updated" },
  { value: "name", label: "Name (A-Z)" },
  { value: "price-high", label: "Price (High)" },
  { value: "price-low", label: "Price (Low)" },
  { value: "stock-high", label: "Stock (High)" },
  { value: "stock-low", label: "Stock (Low)" },
  { value: "margin-high", label: "Margin (High)" },
];

export function ProductAdvancedFilters({
  showFilters,
  categoryFilter,
  setCategoryFilter,
  showAdvancedFilters,
  setShowAdvancedFilters,
  sortBy,
  setSortBy,
  priceRange,
  setPriceRange,
  filteredProducts,
  stats,
  clearFilters,
  hasActiveFilters,
}: ProductAdvancedFiltersProps) {
  if (!showFilters) return null;

  return (
    <div className="px-4 pb-4 space-y-4">
      {/* Category pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-0.5 scrollbar-hide">
        {["All", ...PRODUCT_CATEGORIES].map((cat) => (
          <button
            key={cat}
            onClick={() => setCategoryFilter(cat)}
            className={cn(
              "px-3 py-1 rounded-lg text-xs font-medium border flex-shrink-0 transition-all",
              categoryFilter === cat
                ? "bg-slate-300 dark:bg-slate-600 border-slate-400 dark:border-slate-500 text-slate-900 dark:text-slate-100"
                : "bg-slate-100 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-500 hover:border-slate-300 dark:hover:border-slate-600",
            )}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="space-y-4 pt-2 border-t border-slate-200 dark:border-slate-700">
        {/* Sort dropdown */}
        <div>
          <label
            htmlFor="sortBy"
            className="text-xs font-medium text-slate-600 dark:text-slate-500 block mb-1"
          >
            Sort by
          </label>
          <select
            id="sortBy"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="input-field text-xs"
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Price range toggle */}
        <button
          onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
          className="w-full text-xs font-medium text-slate-500 hover:text-slate-400 py-2 px-3 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 transition-colors text-left"
        >
          {showAdvancedFilters ? "−" : "+"} Advanced Filters
        </button>

        {/* Price range input */}
        {showAdvancedFilters && (
          <div className="bg-slate-100 dark:bg-slate-800/30 p-3 rounded-lg space-y-2">
            <p className="text-xs text-slate-400">Price Range</p>
            <div className="flex gap-2">
              <input
                type="number"
                placeholder="Min"
                min="0"
                value={priceRange?.min ?? ""}
                onChange={(e) =>
                  setPriceRange({
                    min: Number.parseFloat(e.target.value) || 0,
                    max: priceRange?.max ?? 10000,
                  })
                }
                className="input-field text-xs flex-1"
              />
              <input
                type="number"
                placeholder="Max"
                min="0"
                value={priceRange?.max ?? ""}
                onChange={(e) =>
                  setPriceRange({
                    min: priceRange?.min ?? 0,
                    max: Number.parseFloat(e.target.value) || 10000,
                  })
                }
                className="input-field text-xs flex-1"
              />
            </div>
            {priceRange && (
              <button
                onClick={() => setPriceRange(null)}
                className="w-full text-xs text-slate-500 hover:text-slate-400 py-1"
              >
                Clear price filter
              </button>
            )}
          </div>
        )}

        {/* Stats */}
        {filteredProducts.length > 0 && (
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="bg-slate-100 dark:bg-slate-800/30 p-2 rounded-lg">
              <p className="text-slate-500">Stock Value</p>
              <p className="font-bold text-emerald-400">
                ${stats.totalValue.toFixed(2)}
              </p>
            </div>
            <div className="bg-slate-100 dark:bg-slate-800/30 p-2 rounded-lg">
              <p className="text-slate-500">Avg Margin</p>
              <p className="font-bold text-blue-400">{stats.avgMargin}%</p>
            </div>
          </div>
        )}

        <div className="flex flex-col gap-2">
          {/* Export button */}
          <button
            onClick={() => exportProductsToCSV(filteredProducts)}
            className="w-full btn-secondary text-xs py-2 flex items-center justify-center gap-1"
          >
            <Download size={12} />
            Export {filteredProducts.length} items
          </button>

          {/* Clear filters */}
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="w-full text-xs text-slate-500 hover:text-slate-400 py-2"
            >
              Clear all filters
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
