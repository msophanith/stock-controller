"use client";

import { RefreshCw, Plus } from "lucide-react";
import Link from "next/link";
import { Header } from "@/components/ui/header";
import { BottomNav } from "@/components/ui/bottom-nav";
import { useProductFilters } from "./_hooks/use-product-filters";
import { ProductSearchBar } from "./_components/product-search-bar";
import { ProductAdvancedFilters } from "./_components/product-advanced-filters";
import { ProductList } from "./_components/product-list";

export const dynamic = "force-dynamic";

export default function ProductsPage() {
  const {
    products,
    filtered,
    isLoading,
    search,
    setSearch,
    stockFilter,
    setStockFilter,
    categoryFilter,
    setCategoryFilter,
    showFilters,
    setShowFilters,
    sortBy,
    setSortBy,
    priceRange,
    setPriceRange,
    showAdvancedFilters,
    setShowAdvancedFilters,
    hasActiveFilters,
    clearFilters,
    stats,
  } = useProductFilters();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-transparent">
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

      <div className="sticky top-[57px] z-30 bg-white/95 dark:bg-slate-950/95 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800/60">
        <ProductSearchBar
          search={search}
          setSearch={setSearch}
          showFilters={showFilters}
          setShowFilters={setShowFilters}
          stockFilter={stockFilter}
          setStockFilter={setStockFilter}
          hasActiveFilters={hasActiveFilters}
        />

        <ProductAdvancedFilters
          showFilters={showFilters}
          categoryFilter={categoryFilter}
          setCategoryFilter={setCategoryFilter}
          showAdvancedFilters={showAdvancedFilters}
          setShowAdvancedFilters={setShowAdvancedFilters}
          sortBy={sortBy}
          setSortBy={setSortBy}
          priceRange={priceRange}
          setPriceRange={setPriceRange}
          filteredProducts={filtered}
          stats={stats}
          clearFilters={clearFilters}
          hasActiveFilters={hasActiveFilters}
        />
      </div>

      <main>
        <ProductList
          products={filtered}
          hasActiveFilters={hasActiveFilters}
          clearFilters={clearFilters}
        />
      </main>

      <BottomNav />
    </div>
  );
}
