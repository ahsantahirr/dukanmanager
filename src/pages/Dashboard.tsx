import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Package, TrendingUp, DollarSign, AlertTriangle, TrendingDown } from "lucide-react";

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

    // Fetch categories count
    const { count: categoriesCount } = await supabase
      .from("categories")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user?.id);

    // Fetch inventory items
    const { data: inventoryData, count: itemsCount } = await supabase
      .from("inventory_items")
      .select("*, categories(name)", { count: "exact" })
      .eq("user_id", user?.id);

    // Calculate low stock items
    const lowStock = inventoryData?.filter(
      (item) => item.current_stock <= item.minimum_stock
    ) || [];

    // Fetch today's sales
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const { data: todaySalesData } = await supabase
      .from("sales")
      .select("*")
      .eq("user_id", user?.id)
      .gte("sale_date", today.toISOString());

    const todaySalesTotal = todaySalesData?.reduce((sum, sale) => sum + Number(sale.total_amount), 0) || 0;
    const todayProfitTotal = todaySalesData?.reduce((sum, sale) => sum + Number(sale.profit), 0) || 0;

    // Fetch all-time revenue
    const { data: allSales } = await supabase
      .from("sales")
      .select("total_amount")
      .eq("user_id", user?.id);

    const totalRevenue = allSales?.reduce((sum, sale) => sum + Number(sale.total_amount), 0) || 0;

    // Get fast-selling items (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const { data: recentSales } = await supabase
      .from("sales")
      .select("inventory_item_id, quantity, inventory_items(name, categories(name))")
      .eq("user_id", user?.id)
      .gte("sale_date", sevenDaysAgo.toISOString());

    // Aggregate sales by item
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
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4" />
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Overview of your inventory and sales</p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Categories</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalCategories}</div>
            <p className="text-xs text-muted-foreground">Product categories</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Items</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalItems}</div>
            <p className="text-xs text-muted-foreground">In inventory</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Sales</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Rs. {stats.todaySales.toFixed(2)}</div>
            <p className="text-xs text-success">Profit: Rs. {stats.todayProfit.toFixed(2)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Stock</CardTitle>
            <AlertTriangle className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">{stats.lowStockItems}</div>
            <p className="text-xs text-muted-foreground">Items need restocking</p>
          </CardContent>
        </Card>
      </div>

      {/* Alerts and Insights */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-warning" />
              Low Stock Alerts
            </CardTitle>
            <CardDescription>Items running low on stock</CardDescription>
          </CardHeader>
          <CardContent>
            {lowStockAlerts.length === 0 ? (
              <p className="text-sm text-muted-foreground">All items are well stocked!</p>
            ) : (
              <div className="space-y-3">
                {lowStockAlerts.map((item) => (
                  <Alert key={item.id} variant="destructive">
                    <AlertDescription>
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-medium">{item.name}</p>
                          <p className="text-xs">{item.categories?.name}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold">{item.current_stock} {item.unit}</p>
                          <p className="text-xs">Min: {item.minimum_stock}</p>
                        </div>
                      </div>
                    </AlertDescription>
                  </Alert>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-success" />
              Fast Selling Items
            </CardTitle>
            <CardDescription>Top performers (Last 7 days)</CardDescription>
          </CardHeader>
          <CardContent>
            {fastSellingItems.length === 0 ? (
              <p className="text-sm text-muted-foreground">No sales data yet</p>
            ) : (
              <div className="space-y-3">
                {fastSellingItems.map((item: any, index) => (
                  <div key={item.id} className="flex items-center justify-between border-b pb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-primary">#{index + 1}</span>
                      <div>
                        <p className="font-medium text-sm">{item.name}</p>
                        <p className="text-xs text-muted-foreground">{item.category}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-success">{item.totalQuantity.toFixed(2)}</p>
                      <p className="text-xs text-muted-foreground">units sold</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
