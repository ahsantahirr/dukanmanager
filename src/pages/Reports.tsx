import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TrendingUp, DollarSign, Package, Calendar } from "lucide-react";
import { format, subDays, startOfDay, endOfDay } from "date-fns";

export default function Reports() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [dailyStats, setDailyStats] = useState<any[]>([]);
  const [weeklyStats, setWeeklyStats] = useState<any>({});
  const [monthlyStats, setMonthlyStats] = useState<any>({});

  useEffect(() => {
    if (user) {
      fetchReports();
    }
  }, [user]);

  const fetchReports = async () => {
    const today = new Date();
    const last7Days = subDays(today, 7);
    const last30Days = subDays(today, 30);

    // Fetch sales for different periods
    const { data: allSales } = await supabase
      .from("sales")
      .select("*")
      .eq("user_id", user?.id)
      .gte("sale_date", last30Days.toISOString())
      .order("sale_date", { ascending: false });

    // Process daily stats (last 7 days)
    const dailyData: any[] = [];
    for (let i = 6; i >= 0; i--) {
      const date = subDays(today, i);
      const dayStart = startOfDay(date);
      const dayEnd = endOfDay(date);

      const daySales = allSales?.filter(
        (sale) =>
          new Date(sale.sale_date) >= dayStart &&
          new Date(sale.sale_date) <= dayEnd
      ) || [];

      dailyData.push({
        date: format(date, "MMM dd"),
        sales: daySales.reduce((sum, sale) => sum + Number(sale.total_amount), 0),
        profit: daySales.reduce((sum, sale) => sum + Number(sale.profit), 0),
        transactions: daySales.length,
      });
    }

    // Calculate weekly stats
    const weekSales = allSales?.filter(
      (sale) => new Date(sale.sale_date) >= last7Days
    ) || [];

    const weekly = {
      totalSales: weekSales.reduce((sum, sale) => sum + Number(sale.total_amount), 0),
      totalProfit: weekSales.reduce((sum, sale) => sum + Number(sale.profit), 0),
      transactions: weekSales.length,
      avgPerDay: weekSales.reduce((sum, sale) => sum + Number(sale.total_amount), 0) / 7,
    };

    // Calculate monthly stats
    const monthly = {
      totalSales: allSales?.reduce((sum, sale) => sum + Number(sale.total_amount), 0) || 0,
      totalProfit: allSales?.reduce((sum, sale) => sum + Number(sale.profit), 0) || 0,
      transactions: allSales?.length || 0,
      avgPerDay: (allSales?.reduce((sum, sale) => sum + Number(sale.total_amount), 0) || 0) / 30,
    };

    setDailyStats(dailyData);
    setWeeklyStats(weekly);
    setMonthlyStats(monthly);
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4" />
          <p className="text-muted-foreground">Loading reports...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Reports & Analytics</h1>
        <p className="text-muted-foreground">Track your sales performance and trends</p>
      </div>

      <Tabs defaultValue="weekly" className="space-y-4">
        <TabsList>
          <TabsTrigger value="weekly">Weekly</TabsTrigger>
          <TabsTrigger value="monthly">Monthly</TabsTrigger>
          <TabsTrigger value="daily">Daily Breakdown</TabsTrigger>
        </TabsList>

        <TabsContent value="weekly" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">Rs. {weeklyStats.totalSales?.toFixed(2)}</div>
                <p className="text-xs text-muted-foreground">Last 7 days</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Profit</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-success">
                  Rs. {weeklyStats.totalProfit?.toFixed(2)}
                </div>
                <p className="text-xs text-muted-foreground">Last 7 days</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Transactions</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{weeklyStats.transactions}</div>
                <p className="text-xs text-muted-foreground">Last 7 days</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Per Day</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">Rs. {weeklyStats.avgPerDay?.toFixed(2)}</div>
                <p className="text-xs text-muted-foreground">Daily average</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="monthly" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">Rs. {monthlyStats.totalSales?.toFixed(2)}</div>
                <p className="text-xs text-muted-foreground">Last 30 days</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Profit</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-success">
                  Rs. {monthlyStats.totalProfit?.toFixed(2)}
                </div>
                <p className="text-xs text-muted-foreground">Last 30 days</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Transactions</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{monthlyStats.transactions}</div>
                <p className="text-xs text-muted-foreground">Last 30 days</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Per Day</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">Rs. {monthlyStats.avgPerDay?.toFixed(2)}</div>
                <p className="text-xs text-muted-foreground">Daily average</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="daily" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Daily Sales Trend</CardTitle>
              <CardDescription>Sales performance over the last 7 days</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {dailyStats.map((day, index) => (
                  <div key={index} className="flex items-center justify-between border-b pb-3">
                    <div>
                      <p className="font-medium">{day.date}</p>
                      <p className="text-sm text-muted-foreground">
                        {day.transactions} transaction{day.transactions !== 1 ? "s" : ""}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">Rs. {day.sales.toFixed(2)}</p>
                      <p className="text-sm text-success">Profit: Rs. {day.profit.toFixed(2)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
