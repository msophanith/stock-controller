"use client";
// app/history/page.tsx

import { useState, useMemo } from "react";
import {
  TrendingUp,
  TrendingDown,
  SlidersHorizontal,
  Clock,
  RefreshCw,
  Search,
  X,
  RotateCcw,
} from "lucide-react";
import Link from "next/link";
import { Header } from "@/components/ui/header";
import { BottomNav } from "@/components/ui/bottom-nav";
import { useDebounce } from "@/lib/hooks";
import type { StockMovement } from "@/types";
import { formatRelativeDate, cn } from "@/lib/utils";
import { useRecentMovements } from "@/lib/queries";

type FilterType = "ALL" | "IN" | "OUT" | "ADJUSTMENT" | "RETURN";

const FILTER_OPTIONS: { value: FilterType; label: string }[] = [
  { value: "ALL", label: "All" },
  { value: "IN", label: "In" },
  { value: "OUT", label: "Out" },
  { value: "RETURN", label: "Return" },
  { value: "ADJUSTMENT", label: "Adjust" },
];

export default function HistoryPage() {
  const { data: movements = [], isLoading } = useRecentMovements();
  const [filter, setFilter] = useState<FilterType>("ALL");
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);

  const filtered = useMemo(() => {
    let results = movements;

    // Filter by type
    if (filter !== "ALL") {
      results = results.filter((m) => m.type === filter);
    }

    // Search by product name, note, or reference
    if (debouncedSearch) {
      const q = debouncedSearch.toLowerCase();
      results = results.filter((m) => {
        // @ts-ignore - Product is joined in the API
        const productName = m.Product?.name?.toLowerCase() || "";
        const note = m.note?.toLowerCase() || "";
        const ref = m.reference?.toLowerCase() || "";
        return productName.includes(q) || note.includes(q) || ref.includes(q);
      });
    }

    return results;
  }, [movements, filter, debouncedSearch]);

  const movementConfig = {
    IN: {
      icon: TrendingUp,
      label: "Stock In",
      color: "text-emerald-400",
      bg: "bg-emerald-500/10",
      sign: "+",
    },
    OUT: {
      icon: TrendingDown,
      label: "Stock Out",
      color: "text-red-400",
      bg: "bg-red-500/10",
      sign: "−",
    },
    ADJUSTMENT: {
      icon: SlidersHorizontal,
      label: "Adjustment",
      color: "text-blue-400",
      bg: "bg-blue-500/10",
      sign: "⇔",
    },
    RETURN: {
      icon: RotateCcw,
      label: "Customer Return",
      color: "text-amber-400",
      bg: "bg-amber-500/10",
      sign: "+",
    },
  };

  // Group movements by date
  const grouped = useMemo(() => {
    const groups: { date: string; items: StockMovement[] }[] = [];
    let currentDate = "";

    for (const m of filtered) {
      const date = new Date(m.createdAt).toLocaleDateString("en-GB", {
        weekday: "long",
        day: "numeric",
        month: "long",
      });
      if (date !== currentDate) {
        currentDate = date;
        groups.push({ date, items: [] });
      }
      groups.at(-1)!.items.push(m);
    }
    return groups;
  }, [filtered]);

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center py-20 flex-col">
          <RefreshCw className="w-8 h-8 text-orange-500 animate-spin mb-3" />
          <p className="text-slate-400 animate-pulse">Loading history…</p>
        </div>
      );
    }

    if (filtered.length === 0) {
      const hasFilter = search || filter !== "ALL";
      return (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Clock
            size={48}
            className="text-slate-400 dark:text-slate-700 mb-3"
          />
          <p className="text-slate-600 dark:text-slate-400 font-medium">
            {hasFilter ? "No matching movements" : "No movements yet"}
          </p>
          <p className="text-slate-500 dark:text-slate-600 text-sm mt-1">
            {hasFilter
              ? "Try adjusting your search or filters"
              : "Stock movements will appear here"}
          </p>
          {hasFilter && (
            <button
              onClick={() => {
                setSearch("");
                setFilter("ALL");
              }}
              className="btn-secondary mt-4 text-sm py-2"
            >
              <X size={14} /> Clear filters
            </button>
          )}
        </div>
      );
    }

    return grouped.map(({ date, items }) => (
      <section key={date}>
        <h2 className="text-xs font-semibold text-slate-500 dark:text-slate-500 uppercase tracking-wider mb-2 px-1">
          {date}
        </h2>
        <div className="space-y-2">
          {items.map((m) => {
            const config =
              movementConfig[m.type as keyof typeof movementConfig] ||
              movementConfig.ADJUSTMENT;
            const Icon = config.icon;
            // @ts-ignore - Product is joined in the API
            const product = m.Product;

            return (
              <div key={m.id} className="card p-3">
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      "w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0",
                      config.bg,
                    )}
                  >
                    <Icon size={16} className={config.color} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        {product ? (
                          <Link
                            href={`/products/${product.id}`}
                            className="font-medium text-slate-900 dark:text-slate-200 text-sm hover:text-orange-400 truncate block"
                          >
                            {product.name}
                          </Link>
                        ) : (
                          <p className="font-medium text-slate-600 dark:text-slate-400 text-sm">
                            Unknown product
                          </p>
                        )}
                        <p className="text-xs text-slate-600 dark:text-slate-500">
                          {config.label}
                          {m.note ? ` — ${m.note}` : ""}
                        </p>
                        {m.reference && (
                          <p className="text-xs text-slate-500 dark:text-slate-600 font-mono">
                            {m.reference}
                          </p>
                        )}
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p
                          className={cn(
                            "font-price font-bold text-base",
                            config.color,
                          )}
                        >
                          {config.sign}
                          {m.quantity}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-600">
                          {formatRelativeDate(m.createdAt)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    ));
  };

  return (
    <div className="min-h-screen bg-transparent">
      <Header title="History" subtitle={`${filtered.length} movements`} />

      <div className="sticky top-[57px] z-30 bg-white/95 dark:bg-slate-950/95 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800/60 px-4 py-3 space-y-2">
        {/* Search */}
        <div className="relative">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by product, note, reference…"
            className="input-field pl-9 pr-9 py-2.5 text-sm"
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

        {/* Filter pills */}
        <div className="flex gap-2">
          {FILTER_OPTIONS.map(({ value, label }) => {
            const isActive = filter === value;
            return (
              <button
                key={value}
                onClick={() => setFilter(value)}
                className={cn(
                  "px-4 py-1.5 rounded-lg text-sm font-medium border transition-all",
                  isActive
                    ? "bg-orange-500/20 border-orange-500/40 text-orange-400"
                    : "bg-slate-200 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400",
                )}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      <main className="px-4 pb-28 pt-4 space-y-6 page-enter">
        {renderContent()}
      </main>

      <BottomNav />
    </div>
  );
}
