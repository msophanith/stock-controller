"use client";
// app/dashboard/page.tsx

import { useMemo, useState } from "react";
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
  TrendingUp,
  Eye,
  EyeOff,
  RotateCcw,
} from "lucide-react";
import { useProductStore } from "@/store/app-store";
import { useProducts, useTodaySales } from "@/lib/queries";
import { Header } from "@/components/ui/header";
import { BottomNav } from "@/components/ui/bottom-nav";
import { LowStockAlert } from "@/components/stock/low-stock-alert";
import { ProductCard } from "@/components/stock/product-card";
import {
  formatCurrency,
  getStockStatus,
  exportProductsToCSV,
  exportSalesToCSV,
  cn,
} from "@/lib/utils";
import type { Product } from "@/types";

export const dynamic = "force-dynamic";

export default function DashboardPage() {
  const { data: products = [], isLoading } = useProducts();
  const { data: todaySales = [] } = useTodaySales();
  const activityLog = useProductStore((s: any) => s.activityLog);
  const [showAmount, setShowAmount] = useState(false);

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

  const statCards = [
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
        <div className="card p-6 md:p-8 bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-pink-500/10 dark:from-indigo-500/20 dark:via-purple-500/10 dark:to-pink-500/20 border-indigo-500/20 shadow-xl shadow-indigo-500/5 relative overflow-hidden group">
          <div className="absolute -top-20 -right-20 w-48 h-48 bg-indigo-500/20 rounded-full blur-3xl transition-transform duration-700 group-hover:scale-150" />
          <div className="absolute -bottom-20 -left-20 w-48 h-48 bg-pink-500/20 rounded-full blur-3xl transition-transform duration-700 group-hover:scale-150" />

          <div className="relative z-10">
            <div className="mb-2">
              <h2 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest pl-1">
                Today's Revenue
              </h2>
            </div>
            <div className="flex items-center gap-3 mb-1">
              <span className="text-4xl md:text-5xl font-black font-price tracking-tight bg-gradient-to-r from-indigo-600 to-pink-500 dark:from-indigo-400 dark:to-pink-400 bg-clip-text text-transparent transition-all duration-300">
                {showAmount
                  ? formatCurrency(todayStats.totalRevenue)
                  : "$******"}
              </span>
              <button
                onClick={() => setShowAmount(!showAmount)}
                className="p-2 text-slate-400 hover:text-indigo-500 dark:hover:text-indigo-400 hover:bg-slate-200/50 dark:hover:bg-slate-800/50 rounded-full transition-all flex-shrink-0 mt-1"
                title={showAmount ? "Hide amount" : "Show amount"}
              >
                {showAmount ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 pl-1 mb-6 flex flex-wrap items-center gap-y-1 gap-x-3">
              <span className="flex items-center gap-1.5">
                <TrendingUp
                  size={14}
                  className="text-indigo-500 dark:text-indigo-400"
                />
                <span>
                  <span className="text-indigo-500 dark:text-indigo-400 font-bold text-lg">
                    {todayStats.salesCount}{" "}
                  </span>
                  sale
                  {todayStats.salesCount !== 1 ? "s" : ""} today
                </span>
              </span>

              {todayStats.returnsCount > 0 && (
                <span className="flex items-center gap-1.5 border-l border-slate-300 dark:border-slate-700 pl-3">
                  <RotateCcw
                    size={14}
                    className="text-amber-500 dark:text-amber-400"
                  />
                  <div className="flex flex-col sm:flex-row sm:items-baseline sm:gap-2">
                    <span className="flex items-baseline gap-1">
                      <span className="text-amber-500 dark:text-amber-400 font-bold text-lg">
                        {todayStats.returnsCount}{" "}
                      </span>
                      <span className="text-xs">
                        return
                        {todayStats.returnsCount !== 1 ? "s" : ""}
                      </span>
                    </span>
                    <span className="text-[10px] sm:text-xs font-bold text-amber-600/80 dark:text-amber-400/80 bg-amber-500/10 px-1.5 py-0.5 rounded-md">
                      {showAmount
                        ? formatCurrency(todayStats.totalReturnAmount)
                        : "$***"}
                    </span>
                  </div>
                </span>
              )}
            </p>

            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                href="/scan"
                className="btn-primary flex-1 py-4 text-base shadow-indigo-500/25 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 active:from-indigo-700 active:to-purple-800"
              >
                <ScanLine size={20} />
                Quick Scan
              </Link>
              <Link
                href="/scan?action=return"
                className="btn-secondary flex-1 py-4 text-base border-amber-500/20 bg-amber-500/5 hover:bg-amber-500/10 text-amber-600 dark:text-amber-400"
              >
                <RotateCcw size={20} />
                Return Product
              </Link>
              <Link
                href="/products/new"
                className="btn-secondary flex-1 py-4 text-base border-slate-200/60 dark:border-slate-700/60 shadow-sm backdrop-blur-xl"
              >
                <Plus size={20} />
                Add Item
              </Link>
            </div>
          </div>
        </div>

        {/* Bento Stats grid */}
        <div className="grid grid-cols-2 gap-4">
          {statCards.map(({ label, value, icon: Icon, color, bg }) => (
            <div
              key={label}
              className={cn(
                "card p-5 group hover:scale-[1.03] hover:-translate-y-1 transition-all duration-300 relative overflow-hidden",
                bg,
              )}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-transparent dark:from-white/5 opacity-50 block" />
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <div
                    className={cn(
                      "w-10 h-10 rounded-2xl flex items-center justify-center bg-white/60 dark:bg-slate-900/60 backdrop-blur-md shadow-sm border border-black/5 dark:border-white/5",
                      color,
                    )}
                  >
                    <Icon size={20} />
                  </div>
                </div>
                <p
                  className={cn(
                    "text-2xl font-black font-price tracking-tight mb-0.5",
                    color,
                  )}
                >
                  {value}
                </p>
                <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  {label}
                </p>
              </div>
            </div>
          ))}
        </div>

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

        <div className="grid grid-cols-2 gap-3 pt-2">
          <button
            onClick={() => exportProductsToCSV(products)}
            className="w-full btn-secondary py-3.5 flex items-center justify-center gap-2 text-sm bg-white/50 dark:bg-slate-900/50 hover:bg-white/80 dark:hover:bg-slate-800 border-dashed"
          >
            <Download size={16} className="text-slate-500" />
            <span>Products CSV</span>
          </button>
          <button
            onClick={() => exportSalesToCSV(todaySales, "today-sales")}
            className="w-full btn-secondary py-3.5 flex items-center justify-center gap-2 text-sm bg-white/50 dark:bg-slate-900/50 hover:bg-white/80 dark:hover:bg-slate-800 border-dashed"
          >
            <Download size={16} className="text-slate-500" />
            <span>Sales CSV</span>
          </button>
        </div>

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
