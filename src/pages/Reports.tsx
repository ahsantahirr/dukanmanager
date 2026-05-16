import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { TrendingUp, DollarSign, Package, Calendar, Download } from "lucide-react";
import { format, subDays, startOfDay, endOfDay } from "date-fns";
import { toast } from "sonner";
import { PageHeader } from "@/components/PageHeader";
import { PageLoader } from "@/components/PageLoader";
import { StatCard } from "@/components/StatCard";
import { DailySalesChart } from "@/components/DailySalesChart";
import { formatRs } from "@/lib/format";
import { images } from "@/lib/images";
import {
  generateReportPdf,
  type DailyStat,
  type ReportStats,
  type SaleRow,
} from "@/lib/generateReportPdf";

function StatsGrid({
  stats,
  period,
}: {
  stats: ReportStats;
  period: string;
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard
        title="Total Sales"
        value={formatRs(stats.totalSales || 0)}
        subtitle={period}
        icon={DollarSign}
        variant="primary"
      />
      <StatCard
        title="Total Profit"
        value={formatRs(stats.totalProfit || 0)}
        subtitle={period}
        icon={TrendingUp}
        variant="success"
      />
      <StatCard
        title="Transactions"
        value={stats.transactions || 0}
        subtitle={period}
        icon={Package}
      />
      <StatCard
        title="Avg Per Day"
        value={formatRs(stats.avgPerDay || 0)}
        subtitle="Daily average"
        icon={Calendar}
      />
    </div>
  );
}

export default function Reports() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [businessName, setBusinessName] = useState<string>();
  const [dailyStats, setDailyStats] = useState<DailyStat[]>([]);
  const [weeklyStats, setWeeklyStats] = useState<ReportStats>({
    totalSales: 0,
    totalProfit: 0,
    transactions: 0,
    avgPerDay: 0,
  });
  const [monthlyStats, setMonthlyStats] = useState<ReportStats>({
    totalSales: 0,
    totalProfit: 0,
    transactions: 0,
    avgPerDay: 0,
  });
  const [recentSales, setRecentSales] = useState<SaleRow[]>([]);

  useEffect(() => {
    if (user) {
      fetchReports();
    }
  }, [user]);

  const fetchReports = async () => {
    const today = new Date();
    const last7Days = subDays(today, 7);
    const last30Days = subDays(today, 30);

    const [salesRes, profileRes] = await Promise.all([
      supabase
        .from("sales")
        .select("*, inventory_items(name, unit, categories(name))")
        .eq("user_id", user?.id)
        .gte("sale_date", last30Days.toISOString())
        .order("sale_date", { ascending: false }),
      supabase.from("profiles").select("business_name").eq("id", user?.id).single(),
    ]);

    if (profileRes.data?.business_name) {
      setBusinessName(profileRes.data.business_name);
    }

    const allSales = salesRes.data || [];

    const dailyData: DailyStat[] = [];
    for (let i = 6; i >= 0; i--) {
      const date = subDays(today, i);
      const dayStart = startOfDay(date);
      const dayEnd = endOfDay(date);

      const daySales = allSales.filter(
        (sale) =>
          new Date(sale.sale_date) >= dayStart && new Date(sale.sale_date) <= dayEnd
      );

      dailyData.push({
        date: format(date, "MMM dd"),
        sales: daySales.reduce((sum, sale) => sum + Number(sale.total_amount), 0),
        profit: daySales.reduce((sum, sale) => sum + Number(sale.profit), 0),
        transactions: daySales.length,
      });
    }

    const weekSales = allSales.filter((sale) => new Date(sale.sale_date) >= last7Days);

    const weekly: ReportStats = {
      totalSales: weekSales.reduce((sum, sale) => sum + Number(sale.total_amount), 0),
      totalProfit: weekSales.reduce((sum, sale) => sum + Number(sale.profit), 0),
      transactions: weekSales.length,
      avgPerDay: weekSales.reduce((sum, sale) => sum + Number(sale.total_amount), 0) / 7,
    };

    const monthly: ReportStats = {
      totalSales: allSales.reduce((sum, sale) => sum + Number(sale.total_amount), 0),
      totalProfit: allSales.reduce((sum, sale) => sum + Number(sale.profit), 0),
      transactions: allSales.length,
      avgPerDay:
        allSales.reduce((sum, sale) => sum + Number(sale.total_amount), 0) / 30,
    };

    const salesForPdf: SaleRow[] = allSales.slice(0, 50).map((sale) => ({
      date: format(new Date(sale.sale_date), "MMM dd, HH:mm"),
      item: sale.inventory_items?.name || "—",
      category: sale.inventory_items?.categories?.name || "—",
      quantity: `${Number(sale.quantity).toFixed(2)} ${sale.inventory_items?.unit || ""}`.trim(),
      total: Number(sale.total_amount),
      profit: Number(sale.profit),
    }));

    setDailyStats(dailyData);
    setWeeklyStats(weekly);
    setMonthlyStats(monthly);
    setRecentSales(salesForPdf);
    setLoading(false);
  };

  const handleDownloadPdf = () => {
    if ((weeklyStats.transactions || 0) === 0) {
      toast.error("No sales data to export. Record some sales first.");
      return;
    }

    setDownloading(true);
    try {
      generateReportPdf({
        businessName,
        weekly: weeklyStats,
        monthly: monthlyStats,
        daily: dailyStats,
        recentSales,
      });
      toast.success("Report downloaded as PDF");
    } catch {
      toast.error("Failed to generate PDF. Please try again.");
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return <PageLoader message="Loading reports..." />;
  }

  const hasData = (weeklyStats.transactions || 0) > 0;

  return (
    <div className="space-y-8">
      <PageHeader
        title="Reports & Analytics"
        description="Understand sales trends, profit, and daily performance."
        action={
          <Button
            size="lg"
            className="shadow-md"
            onClick={handleDownloadPdf}
            disabled={downloading || !hasData}
          >
            <Download className="mr-2 h-4 w-4" />
            {downloading ? "Generating..." : "Download PDF"}
          </Button>
        }
      />

      <div className="relative overflow-hidden rounded-2xl shadow-card">
        <img
          src={images.emptyReports}
          alt=""
          className="absolute inset-0 h-full w-full object-cover opacity-40"
        />
        <div className="relative bg-gradient-to-r from-primary/90 to-accent/80 p-6 text-white sm:p-8">
          <p className="text-sm font-medium text-white/80">Performance snapshot</p>
          <p className="mt-1 text-2xl font-bold sm:text-3xl">
            {hasData
              ? `${weeklyStats.transactions} sales this week`
              : "Record sales to see analytics"}
          </p>
          {hasData && (
            <p className="mt-2 text-white/90">
              Weekly revenue: {formatRs(weeklyStats.totalSales || 0)} · Profit:{" "}
              {formatRs(weeklyStats.totalProfit || 0)}
            </p>
          )}
        </div>
      </div>

      <Tabs defaultValue="weekly" className="space-y-6">
        <TabsList className="grid h-11 w-full max-w-md grid-cols-3">
          <TabsTrigger value="weekly">Weekly</TabsTrigger>
          <TabsTrigger value="monthly">Monthly</TabsTrigger>
          <TabsTrigger value="daily">Daily</TabsTrigger>
        </TabsList>

        <TabsContent value="weekly" className="space-y-4">
          <StatsGrid stats={weeklyStats} period="Last 7 days" />
        </TabsContent>

        <TabsContent value="monthly" className="space-y-4">
          <StatsGrid stats={monthlyStats} period="Last 30 days" />
        </TabsContent>

        <TabsContent value="daily" className="space-y-4">
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle>Daily Sales Trend</CardTitle>
              <CardDescription>Revenue over the last 7 days</CardDescription>
            </CardHeader>
            <CardContent>
              {!hasData ? (
                <p className="py-8 text-center text-muted-foreground">
                  No sales data yet — record a sale to see trends.
                </p>
              ) : (
                <DailySalesChart data={dailyStats} />
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
