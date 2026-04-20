"use client";
// app/dashboard/page.tsx

import { useMemo } from "react";
import Link from "next/link";
import {
  Package,
  AlertTriangle,
  DollarSign,
  ArrowRight,
  BoxesIcon,
  RefreshCw,
  ScanLine,
  Plus,
} from "lucide-react";
import { useProductStore } from "@/store/app-store";
import { useProducts, useTodaySales } from "@/lib/queries";
import { Header } from "@/components/ui/header";
import { BottomNav } from "@/components/ui/bottom-nav";
import { LowStockAlert } from "@/components/stock/low-stock-alert";
import { ProductCard } from "@/components/stock/product-card";
import { formatCurrency, getStockStatus } from "@/lib/utils";
import type { Product } from "@/types";

// Dashboard Components
import { RevenueHero } from "@/components/dashboard/revenue-hero";
import { StatsGrid, type StatCard } from "@/components/dashboard/stats-grid";
import { ExportFAB } from "@/components/dashboard/export-fab";

export const dynamic = "force-dynamic";

export default function DashboardPage() {
  const { data: products = [], isLoading } = useProducts();
  const { data: todaySales = [] } = useTodaySales();
  const activityLog = useProductStore((s: any) => s.activityLog);

  const todayStats = useMemo(() => {
    const sales = todaySales.filter((m: any) => m.type === "OUT");
    const returns = todaySales.filter((m: any) => m.type === "RETURN");

    const salesCount = sales.length;
    const returnsCount = returns.length;

    const totalRevenue = sales.reduce(
      (acc: number, sale: any) =>
        acc + sale.quantity * (sale.Product?.sellPrice || 0),
      0,
    );

    const totalReturnAmount = returns.reduce(
      (acc: number, ret: any) =>
        acc + ret.quantity * (ret.Product?.sellPrice || 0),
      0,
    );

    return { salesCount, returnsCount, totalRevenue, totalReturnAmount };
  }, [todaySales]);

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

  const statCards: StatCard[] = [
    {
      label: "Total Items",
      value: stats.totalProducts.toString(),
      icon: Package,
      color: "text-blue-600 dark:text-blue-400",
      bg: "bg-blue-500/10 border-blue-500/20",
    },
    {
      label: "Stock Value",
      value: formatCurrency(stats.totalValue),
      icon: DollarSign,
      color: "text-emerald-600 dark:text-emerald-400",
      bg: "bg-emerald-500/10 border-emerald-500/20",
    },
    {
      label: "Low Stock",
      value: stats.lowStockCount.toString(),
      icon: AlertTriangle,
      color: "text-amber-600 dark:text-amber-400",
      bg: "bg-amber-500/10 border-amber-500/20",
    },
    {
      label: "Out of Stock",
      value: stats.outOfStockCount.toString(),
      icon: BoxesIcon,
      color: "text-red-600 dark:text-red-400",
      bg: "bg-red-500/10 border-red-500/20",
    },
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-transparent">
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
    <div className="min-h-screen bg-transparent">
      <Header title="Accessories Stock" subtitle="Car Accessories Inventory" />

      <main className="px-4 pb-32 pt-4 space-y-8 page-enter">
        {/* Modern Hero Card */}
        <RevenueHero todayStats={todayStats} />

        {/* Bento Stats grid */}
        <StatsGrid cards={statCards} />

        {/* Low stock alerts */}
        {stats.alertProducts.length > 0 && (
          <section>
            <h2 className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-3 pl-1">
              Alerts
            </h2>
            <LowStockAlert products={stats.alertProducts} />
          </section>
        )}

        {/* Recent products with quick actions */}
        {stats.recentProducts.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-3 pl-1">
              <h2 className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                Recent
              </h2>
              <Link
                href="/products"
                className="text-xs font-bold text-indigo-500 hover:text-indigo-400 flex items-center gap-1 transition-colors"
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
            <div className="flex items-center justify-between mb-3 pl-1">
              <h2 className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                Recent Activity
              </h2>
              <Link
                href="/history"
                className="text-xs font-bold text-indigo-500 hover:text-indigo-400 flex items-center gap-1 transition-colors"
              >
                View all <ArrowRight size={12} />
              </Link>
            </div>
            <div className="card p-2 space-y-1 max-h-48 overflow-y-auto backdrop-blur-xl bg-white/40 dark:bg-slate-900/40">
              {activityLog.slice(0, 5).map((log: string, idx: number) => (
                <div
                  key={`log-${idx}`}
                  className="flex items-center gap-3 text-[13px] py-3 px-3 border-b border-slate-200/50 dark:border-slate-800/50 last:border-b-0 hover:bg-white/60 dark:hover:bg-slate-800/60 rounded-xl transition-all duration-200"
                >
                  <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse flex-shrink-0 shadow-[0_0_8px_rgba(99,102,241,0.5)]" />
                  <span className="font-medium text-slate-700 dark:text-slate-300 flex-1 truncate">
                    {log}
                  </span>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex-shrink-0">
                    now
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}

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

      {/* Floating Export Action */}
      <ExportFAB products={products} todaySales={todaySales} />

      <BottomNav />
    </div>
  );
}
