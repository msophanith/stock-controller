import { useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useProducts } from "@/lib/queries";
import { useDebounce, useBarcodeScannerListener } from "@/lib/hooks";
import { getStockStatus } from "@/lib/utils";
import type { Product } from "@/types";

export function useProductFilters() {
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
      const match = products.find((p: Product) => p.barcode === barcode);
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
  }, [
    products,
    debouncedSearch,
    stockFilter,
    categoryFilter,
    sortBy,
    priceRange,
  ]);

  const hasActiveFilters =
    stockFilter !== "all" ||
    categoryFilter !== "All" ||
    search !== "" ||
    priceRange !== null ||
    sortBy !== "recent";

  const clearFilters = useCallback(() => {
    setSearch("");
    setStockFilter("all");
    setCategoryFilter("All");
    setPriceRange(null);
    setSortBy("recent");
  }, []);

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

  return {
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
  };
}
