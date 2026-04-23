import { Header } from "@/components/ui/header";
import { BottomNav } from "@/components/ui/bottom-nav";

export default function DashboardLoading() {
  return (
    <div className="min-h-screen bg-transparent">
      <Header title="Accessories Stock" subtitle="Car Accessories Inventory" />

      <main className="px-4 pb-32 pt-4 space-y-8 animate-pulse">
        {/* Hero Skeleton */}
        <div className="h-64 rounded-3xl bg-slate-200 dark:bg-slate-800/50" />

        {/* Stats Grid Skeleton */}
        <div className="grid grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-32 rounded-2xl bg-slate-200 dark:bg-slate-800/50"
            />
          ))}
        </div>

        {/* Alerts Skeleton */}
        <div className="space-y-3">
          <div className="h-4 w-20 bg-slate-200 dark:bg-slate-800/50 rounded" />
          <div className="h-24 rounded-2xl bg-slate-200 dark:bg-slate-800/50" />
        </div>

        {/* Recent Products Skeleton */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <div className="h-4 w-20 bg-slate-200 dark:bg-slate-800/50 rounded" />
            <div className="h-4 w-24 bg-slate-200 dark:bg-slate-800/50 rounded" />
          </div>
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-20 rounded-xl bg-slate-200 dark:bg-slate-800/50"
            />
          ))}
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
