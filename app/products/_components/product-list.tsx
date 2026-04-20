"use client";

import { Search, X } from "lucide-react";
import { ProductCard } from "@/components/stock/product-card";
import type { Product } from "@/types";

interface ProductListProps {
  readonly products: Product[];
  readonly hasActiveFilters: boolean;
  readonly clearFilters: () => void;
}

export function ProductList({
  products,
  hasActiveFilters,
  clearFilters,
}: ProductListProps) {
  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <Search size={48} className="text-slate-400 dark:text-slate-700 mb-3" />
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
            onClick={clearFilters}
            className="btn-secondary mt-4 text-sm py-2"
          >
            <X size={14} /> Clear filters
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="px-4 pb-28 pt-3 space-y-2 page-enter">
      {products.map((p) => (
        <ProductCard key={p.id} product={p} />
      ))}
    </div>
  );
}
