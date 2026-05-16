import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageLoader } from "@/components/PageLoader";
import { StatCard } from "@/components/StatCard";
import { formatRs } from "@/lib/format";
import { images } from "@/lib/images";
import { getProductImage } from "@/lib/images";
import { EntityImage } from "@/components/EntityImage";
import {
  Package,
  TrendingUp,
  DollarSign,
  AlertTriangle,
  ShoppingCart,
  ArrowRight,
} from "lucide-react";

export default function Dashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalCategories: 0,
    totalItems: 0,
    lowStockItems: 0,
    todaySales: 0,
    todayProfit: 0,
    totalRevenue: 0,
  });
  const [lowStockAlerts, setLowStockAlerts] = useState<any[]>([]);
  const [fastSellingItems, setFastSellingItems] = useState<any[]>([]);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    setLoading(true);

    const { count: categoriesCount } = await supabase
      .from("categories")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user?.id);

    const { data: inventoryData, count: itemsCount } = await supabase
      .from("inventory_items")
      .select("*, categories(name)", { count: "exact" })
      .eq("user_id", user?.id);

    const lowStock =
      inventoryData?.filter((item) => item.current_stock <= item.minimum_stock) || [];

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { data: todaySalesData } = await supabase
      .from("sales")
      .select("*")
      .eq("user_id", user?.id)
      .gte("sale_date", today.toISOString());

    const todaySalesTotal =
      todaySalesData?.reduce((sum, sale) => sum + Number(sale.total_amount), 0) || 0;
    const todayProfitTotal =
      todaySalesData?.reduce((sum, sale) => sum + Number(sale.profit), 0) || 0;

    const { data: allSales } = await supabase
      .from("sales")
      .select("total_amount")
      .eq("user_id", user?.id);

    const totalRevenue =
      allSales?.reduce((sum, sale) => sum + Number(sale.total_amount), 0) || 0;

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const { data: recentSales } = await supabase
      .from("sales")
      .select("inventory_item_id, quantity, inventory_items(name, categories(name))")
      .eq("user_id", user?.id)
      .gte("sale_date", sevenDaysAgo.toISOString());

    const salesByItem = recentSales?.reduce((acc: any, sale: any) => {
      const itemId = sale.inventory_item_id;
      if (!acc[itemId]) {
        acc[itemId] = {
          id: itemId,
          name: sale.inventory_items?.name,
          category: sale.inventory_items?.categories?.name,
          totalQuantity: 0,
        };
      }
      acc[itemId].totalQuantity += Number(sale.quantity);
      return acc;
    }, {});

    const fastSelling = Object.values(salesByItem || {})
      .sort((a: any, b: any) => b.totalQuantity - a.totalQuantity)
      .slice(0, 5);

    setStats({
      totalCategories: categoriesCount || 0,
      totalItems: itemsCount || 0,
      lowStockItems: lowStock.length,
      todaySales: todaySalesTotal,
      todayProfit: todayProfitTotal,
      totalRevenue,
    });

    setLowStockAlerts(lowStock.slice(0, 5));
    setFastSellingItems(fastSelling as any);
    setLoading(false);
  };

  if (loading) {
    return <PageLoader message="Loading dashboard..." />;
  }

  return (
    <div className="space-y-8">
      {/* Welcome banner */}
      <div className="relative overflow-hidden rounded-2xl shadow-card">
        <img
          src={images.dashboardBanner}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="image-overlay" />
        <div className="relative flex flex-col gap-4 p-6 text-white sm:flex-row sm:items-center sm:justify-between sm:p-8">
          <div>
            <Badge className="mb-3 bg-white/20 text-white hover:bg-white/25">Dashboard</Badge>
            <h1 className="text-2xl font-bold sm:text-3xl">Welcome to your dukan</h1>
            <p className="mt-1 max-w-md text-white/80">
              {stats.totalRevenue > 0
                ? `All-time revenue: ${formatRs(stats.totalRevenue)}`
                : "Add categories and stock to get started"}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="secondary" className="shadow-md">
              <Link to="/sales">
                <ShoppingCart className="mr-2 h-4 w-4" />
                Record Sale
              </Link>
            </Button>
            <Button asChild variant="outline" className="border-white/30 bg-white/10 text-white hover:bg-white/20 hover:text-white">
              <Link to="/inventory">
                Manage Stock
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Categories"
          value={stats.totalCategories}
          subtitle="Product groups"
          icon={Package}
          variant="primary"
        />
        <StatCard
          title="Total Items"
          value={stats.totalItems}
          subtitle="In inventory"
          icon={Package}
        />
        <StatCard
          title="Today's Sales"
          value={formatRs(stats.todaySales)}
          subtitle={`Profit: ${formatRs(stats.todayProfit)}`}
          icon={DollarSign}
          variant="success"
        />
        <StatCard
          title="Low Stock"
          value={stats.lowStockItems}
          subtitle="Need restocking"
          icon={AlertTriangle}
          variant="warning"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="overflow-hidden shadow-card">
          <CardHeader className="border-b bg-warning/5">
            <CardTitle className="flex items-center gap-2 text-lg">
              <AlertTriangle className="h-5 w-5 text-warning" />
              Low Stock Alerts
            </CardTitle>
            <CardDescription>Items running low — restock soon</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {lowStockAlerts.length === 0 ? (
              <p className="p-6 text-sm text-muted-foreground">All items are well stocked!</p>
            ) : (
              <ul className="divide-y">
                {lowStockAlerts.map((item) => (
                  <li key={item.id} className="flex items-center gap-4 p-4 transition-colors hover:bg-muted/40">
                    <EntityImage
                      type="inventory"
                      entityId={item.id}
                      fallback={getProductImage(item.name)}
                      className="h-12 w-12 rounded-lg ring-2 ring-background"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="font-medium">{item.name}</p>
                      <p className="text-xs text-muted-foreground">{item.categories?.name}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-warning">
                        {item.current_stock} {item.unit}
                      </p>
                      <p className="text-xs text-muted-foreground">Min: {item.minimum_stock}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card className="overflow-hidden shadow-card">
          <CardHeader className="border-b bg-success/5">
            <CardTitle className="flex items-center gap-2 text-lg">
              <TrendingUp className="h-5 w-5 text-success" />
              Fast Selling Items
            </CardTitle>
            <CardDescription>Top performers — last 7 days</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {fastSellingItems.length === 0 ? (
              <p className="p-6 text-sm text-muted-foreground">No sales data yet</p>
            ) : (
              <ul className="divide-y">
                {fastSellingItems.map((item: any, index) => (
                  <li key={item.id} className="flex items-center gap-4 p-4 transition-colors hover:bg-muted/40">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-lg font-bold text-primary">
                      #{index + 1}
                    </div>
                    <EntityImage
                      type="inventory"
                      entityId={item.id}
                      fallback={getProductImage(item.name || "")}
                      className="h-12 w-12 rounded-lg ring-2 ring-background"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="font-medium">{item.name}</p>
                      <p className="text-xs text-muted-foreground">{item.category}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-success">{item.totalQuantity.toFixed(2)}</p>
                      <p className="text-xs text-muted-foreground">units sold</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
