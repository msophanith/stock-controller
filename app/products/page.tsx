"use client";
// app/products/page.tsx

import { useState, useMemo, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, Plus, Filter, X, Download, RefreshCw, Usb } from "lucide-react";
import { useProducts } from "@/lib/queries";
import { useDebounce, useBarcodeScannerListener } from "@/lib/hooks";
import { toast } from "sonner";
import { Header } from "@/components/ui/header";
import { BottomNav } from "@/components/ui/bottom-nav";
import { ProductCard } from "@/components/stock/product-card";
import {
  getStockStatus,
  PRODUCT_CATEGORIES,
  cn,
  exportProductsToCSV,
} from "@/lib/utils";
import type { Product } from "@/types";

export const dynamic = "force-dynamic";

const FILTERS = [
  { value: "all", label: "All" },
  { value: "low", label: "Low Stock" },
  { value: "out", label: "Out of Stock" },
  { value: "ok", label: "In Stock" },
];

const SORT_OPTIONS = [
  { value: "recent", label: "Recently Updated" },
  { value: "name", label: "Name (A-Z)" },
  { value: "price-high", label: "Price (High)" },
  { value: "price-low", label: "Price (Low)" },
  { value: "stock-high", label: "Stock (High)" },
  { value: "stock-low", label: "Stock (Low)" },
  { value: "margin-high", label: "Margin (High)" },
];

export default function ProductsPage() {
  const router = useRouter();
  const { data: products = [], isLoading } = useProducts();
  const [search, setSearch] = useState("");
  const [stockFilter, setStockFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState("recent");
  const [priceRange, setPriceRange] = useState<{
    min: number;
    max: number;
  } | null>(null);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  const debouncedSearch = useDebounce(search, 300);

  // Physical barcode scanner → navigate to product detail
  const handleHardwareScan = useCallback(
    (barcode: string) => {
      const match = products.find(
        (p: Product) => p.barcode === barcode,
      );
      if (match) {
        toast.success(`Found: ${match.name}`);
        router.push(`/products/${match.id}`);
      } else {
        toast.info(`Barcode "${barcode}" not found`, {
          action: {
            label: "Add product",
            onClick: () =>
              router.push(
                `/products/new?barcode=${encodeURIComponent(barcode)}`,
              ),
          },
        });
      }
    },
    [products, router],
  );
  useBarcodeScannerListener(handleHardwareScan);

  const filtered = useMemo(() => {
    const q = debouncedSearch.toLowerCase();
    let results = products.filter((p: Product) => {
      const matchesSearch =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.barcode.includes(q) ||
        p.category.toLowerCase().includes(q) ||
        (p.shelf?.toLowerCase().includes(q) ?? false);

      const status = getStockStatus(p.quantity, p.minStock);
      const matchesStock =
        stockFilter === "all" ||
        (stockFilter === "out" && status === "out") ||
        (stockFilter === "low" && status === "low") ||
        (stockFilter === "ok" && (status === "ok" || status === "good"));

      const matchesCategory =
        categoryFilter === "All" || p.category === categoryFilter;

      const matchesPrice =
        !priceRange ||
        (p.sellPrice >= priceRange.min && p.sellPrice <= priceRange.max);

      return matchesSearch && matchesStock && matchesCategory && matchesPrice;
    });

    // Sort results
    results.sort((a: Product, b: Product) => {
      switch (sortBy) {
        case "name":
          return a.name.localeCompare(b.name);
        case "price-high":
          return b.sellPrice - a.sellPrice;
        case "price-low":
          return a.sellPrice - b.sellPrice;
        case "stock-high":
          return b.quantity - a.quantity;
        case "stock-low":
          return a.quantity - b.quantity;
        case "margin-high": {
          const marginA = ((a.sellPrice - a.buyPrice) / a.buyPrice) * 100;
          const marginB = ((b.sellPrice - b.buyPrice) / b.buyPrice) * 100;
          return marginB - marginA;
        }
        case "recent":
        default:
          return (
            new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
          );
      }
    });

    return results;
  }, [products, debouncedSearch, stockFilter, categoryFilter, sortBy, priceRange]);

  const hasActiveFilters =
    stockFilter !== "all" ||
    categoryFilter !== "All" ||
    search !== "" ||
    priceRange !== null ||
    sortBy !== "recent";

  const stats = useMemo(() => {
    const totalValue = filtered.reduce(
      (acc: number, p: Product) => acc + p.sellPrice * p.quantity,
      0,
    );
    const avgMargin =
      filtered.length > 0
        ? (
            filtered.reduce(
              (acc: number, p: Product) =>
                acc + ((p.sellPrice - p.buyPrice) / p.buyPrice) * 100,
              0,
            ) / filtered.length
          ).toFixed(1)
        : "0";
    return { totalValue, avgMargin };
  }, [filtered]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white dark:bg-slate-950">
        <Header title="Products" subtitle="Loading…" />
        <main className="px-4 pt-20 flex flex-col items-center justify-center">
          <RefreshCw className="w-8 h-8 text-orange-500 animate-spin mb-4" />
          <p className="text-slate-400 animate-pulse">Loading product list…</p>
        </main>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950">
      <Header
        title="Products"
        subtitle={`${filtered.length} of ${products.length} items`}
        action={
          <Link href="/products/new" className="btn-primary py-2 px-3 text-sm">
            <Plus size={16} />
            Add
          </Link>
        }
      />

      <div className="sticky top-[57px] z-30 bg-white/95 dark:bg-slate-950/95 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800/60 px-4 py-3 space-y-2">
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

        {/* Category pills */}
        {showFilters && (
          <div className="flex items-center gap-2 overflow-x-auto pb-0.5">
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
        )}

        {/* Advanced filters & sort */}
        {showFilters && (
          <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-700">
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
            {filtered.length > 0 && (
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

            {/* Export button */}
            <button
              onClick={() => exportProductsToCSV(filtered)}
              className="w-full btn-secondary text-xs py-2 flex items-center justify-center gap-1"
            >
              <Download size={12} />
              Export {filtered.length} items
            </button>

            {/* Clear filters */}
            {hasActiveFilters && (
              <button
                onClick={() => {
                  setSearch("");
                  setStockFilter("all");
                  setCategoryFilter("All");
                  setPriceRange(null);
                  setSortBy("recent");
                }}
                className="w-full text-xs text-slate-500 hover:text-slate-400 py-2"
              >
                Clear all filters
              </button>
            )}
          </div>
        )}
      </div>

      <main className="px-4 pb-28 pt-3 space-y-2 page-enter">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Search
              size={48}
              className="text-slate-400 dark:text-slate-700 mb-3"
            />
            <p className="text-slate-600 dark:text-slate-400 font-medium">
              No products found
            </p>
            <p className="text-slate-500 dark:text-slate-600 text-sm mt-1">
              {hasActiveFilters
                ? "Try adjusting your filters"
                : "Add your first product"}
            </p>
            {hasActiveFilters && (
              <button
                onClick={() => {
                  setSearch("");
                  setStockFilter("all");
                  setCategoryFilter("All");
                  setPriceRange(null);
                  setSortBy("recent");
                }}
                className="btn-secondary mt-4 text-sm py-2"
              >
                <X size={14} /> Clear filters
              </button>
            )}
          </div>
        ) : (
          filtered.map((p) => <ProductCard key={p.id} product={p} />)
        )}
      </main>

      <BottomNav />
    </div>
  );
}
