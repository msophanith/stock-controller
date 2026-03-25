"use client";
// app/dashboard/page.tsx

import { useMemo } from "react";
import Link from "next/link";
import {
  Package,
  AlertTriangle,
  DollarSign,
  ScanLine,
  Plus,
  ArrowRight,
  BoxesIcon,
  Download,
  RefreshCw,
} from "lucide-react";
import { useProductStore } from "@/store/app-store";
import { useProducts } from "@/lib/queries";
import { Header } from "@/components/ui/header";
import { BottomNav } from "@/components/ui/bottom-nav";
import { LowStockAlert } from "@/components/stock/low-stock-alert";
import { ProductCard } from "@/components/stock/product-card";
import {
  formatCurrency,
  getStockStatus,
  exportProductsToCSV,
  cn,
} from "@/lib/utils";
import type { Product } from "@/types";

export const dynamic = "force-dynamic";

export default function DashboardPage() {
  const { data: products = [], isLoading } = useProducts();
  const activityLog = useProductStore((s: any) => s.activityLog);

  const stats = useMemo(() => {
    const totalProducts = products.length;
    const totalValue = products.reduce(
      (acc: number, p: Product) => acc + p.sellPrice * p.quantity,
      0,
    );
    const lowStockProducts = products.filter(
      (p: Product) => getStockStatus(p.quantity, p.minStock) === "low",
    );
    const outOfStockProducts = products.filter(
      (p: Product) => p.quantity === 0,
    );
    const alertProducts = [...outOfStockProducts, ...lowStockProducts];

    const recentProducts = [...products]
      .sort(
        (a, b) =>
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
      )
      .slice(0, 5);

    return {
      totalProducts,
      totalValue,
      lowStockCount: lowStockProducts.length,
      outOfStockCount: outOfStockProducts.length,
      alertProducts,
      recentProducts,
    };
  }, [products]);

  const statCards = [
    {
      label: "Total Products",
      value: stats.totalProducts.toString(),
      icon: Package,
      color: "text-blue-400",
      bg: "bg-blue-500/10 border-blue-500/20",
    },
    {
      label: "Stock Value",
      value: formatCurrency(stats.totalValue),
      icon: DollarSign,
      color: "text-emerald-400",
      bg: "bg-emerald-500/10 border-emerald-500/20",
    },
    {
      label: "Low Stock",
      value: stats.lowStockCount.toString(),
      icon: AlertTriangle,
      color: "text-amber-400",
      bg: "bg-amber-500/10 border-amber-500/20",
    },
    {
      label: "Out of Stock",
      value: stats.outOfStockCount.toString(),
      icon: BoxesIcon,
      color: "text-red-400",
      bg: "bg-red-500/10 border-red-500/20",
    },
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white dark:bg-slate-950">
        <Header title="Accessory Stock" subtitle="Car Accessories Inventory" />
        <main className="px-4 pt-20 flex flex-col items-center justify-center">
          <RefreshCw className="w-8 h-8 text-orange-500 animate-spin mb-4" />
          <p className="text-slate-400 animate-pulse">Loading dashboard…</p>
        </main>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950">
      <Header title="Accessories Stock" subtitle="Car Accessories Inventory" />

      <main className="px-4 pb-28 pt-4 space-y-6 page-enter">
        {/* Quick actions */}
        <div className="grid grid-cols-2 gap-3">
          <Link href="/scan" className="btn-primary py-4 text-base">
            <ScanLine size={22} />
            Scan
          </Link>
          <Link href="/products/new" className="btn-secondary py-4 text-base">
            <Plus size={22} />
            Add Product
          </Link>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-3">
          {statCards.map(({ label, value, icon: Icon, color, bg }) => (
            <div key={label} className={cn("card p-4 border", bg)}>
              <div className="flex items-start justify-between mb-3">
                <Icon size={20} className={color} />
              </div>
              <p className={cn("text-2xl font-bold font-price", color)}>
                {value}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-500 mt-0.5">
                {label}
              </p>
            </div>
          ))}
        </div>

        {/* Low stock alerts */}
        {stats.alertProducts.length > 0 && (
          <section>
            <h2 className="text-sm font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-3">
              Alerts
            </h2>
            <LowStockAlert products={stats.alertProducts} />
          </section>
        )}

        {/* Recent products with quick actions */}
        {stats.recentProducts.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                Recent
              </h2>
              <Link
                href="/products"
                className="text-xs text-orange-400 hover:text-orange-300 flex items-center gap-1"
              >
                All products <ArrowRight size={12} />
              </Link>
            </div>
            <div className="space-y-2">
              {stats.recentProducts.map((p) => (
                <ProductCard key={p.id} product={p} showQuickActions={true} />
              ))}
            </div>
          </section>
        )}

        {/* Activity log */}
        {activityLog.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                Recent Activity
              </h2>
              <Link
                href="/history"
                className="text-xs text-orange-400 hover:text-orange-300 flex items-center gap-1"
              >
                View all <ArrowRight size={12} />
              </Link>
            </div>
            <div className="card p-3 space-y-2 max-h-40 overflow-y-auto">
              {activityLog.slice(0, 5).map((log: string, idx: number) => (
                <div
                  key={`log-${idx}`}
                  className="flex items-center justify-between text-xs py-1.5 border-b border-slate-700 last:border-b-0"
                >
                  <span className="text-slate-400">{log}</span>
                  <span className="text-slate-600">now</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Export button */}
        <button
          onClick={() => exportProductsToCSV(products)}
          className="w-full btn-secondary py-3 flex items-center justify-center gap-2"
        >
          <Download size={18} />
          Export to CSV
        </button>

        {/* Empty state */}
        {products.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Package
              size={56}
              className="text-slate-400 dark:text-slate-700 mb-4"
            />
            <h3 className="text-lg font-semibold text-slate-600 dark:text-slate-400">
              No products yet
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-600 mt-1 mb-6">
              Start by scanning a barcode or adding a product manually
            </p>
            <div className="flex gap-3">
              <Link href="/scan" className="btn-primary">
                <ScanLine size={18} /> Scan Barcode
              </Link>
              <Link href="/products/new" className="btn-secondary">
                <Plus size={18} /> Add Manually
              </Link>
            </div>
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
