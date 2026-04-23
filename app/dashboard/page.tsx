// app/dashboard/page.tsx
import { getDashboardSummary, getTodaySales } from "@/lib/supabaseDb";
import DashboardClient from "./DashboardClient";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  // Fetch dashboard summary and today's sales in parallel
  const [summary, todaySales] = await Promise.all([
    getDashboardSummary(),
    getTodaySales(),
  ]);

  return (
    <DashboardClient
      initialProducts={[]} // We pass empty array for allProducts as it's not needed for initial view
      initialTodaySales={todaySales}
      initialStats={summary.stats}
      recentProducts={summary.recentProducts}
      alertProducts={summary.alertProducts}
    />
  );
}
