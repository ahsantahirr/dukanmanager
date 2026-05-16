import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Plus, ShoppingCart } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";
import { PageHeader } from "@/components/PageHeader";
import { PageLoader } from "@/components/PageLoader";
import { EmptyState, EmptyStateButton } from "@/components/EmptyState";
import { formatRs } from "@/lib/format";
import { images, getProductImage } from "@/lib/images";
import { EntityImage } from "@/components/EntityImage";

export default function Sales() {
  const { user } = useAuth();
  const [sales, setSales] = useState<any[]>([]);
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    const [salesRes, itemsRes] = await Promise.all([
      supabase
        .from("sales")
        .select("*, inventory_items(name, unit, categories(name))")
        .eq("user_id", user?.id)
        .order("sale_date", { ascending: false })
        .limit(50),
      supabase
        .from("inventory_items")
        .select("*, categories(name)")
        .eq("user_id", user?.id)
        .gt("current_stock", 0)
        .order("name"),
    ]);

    if (salesRes.error) {
      toast.error("Error fetching sales");
    } else {
      setSales(salesRes.data || []);
    }

    if (itemsRes.error) {
      toast.error("Error fetching items");
    } else {
      setItems(itemsRes.data || []);
    }

    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const quantity = parseFloat(formData.get("quantity") as string);
    const salePrice = parseFloat(formData.get("sale_price") as string);

    if (!selectedItem) {
      toast.error("Please select an item");
      return;
    }

    if (quantity > selectedItem.current_stock) {
      toast.error("Not enough stock available");
      return;
    }

    const totalAmount = quantity * salePrice;
    const profit = totalAmount - quantity * Number(selectedItem.purchase_price);

    const { error: saleError } = await supabase.from("sales").insert({
      user_id: user?.id,
      inventory_item_id: selectedItem.id,
      quantity,
      sale_price: salePrice,
      total_amount: totalAmount,
      profit,
    });

    if (saleError) {
      toast.error("Error recording sale");
      return;
    }

    const newStock = selectedItem.current_stock - quantity;
    const { error: updateError } = await supabase
      .from("inventory_items")
      .update({ current_stock: newStock })
      .eq("id", selectedItem.id);

    if (updateError) {
      toast.error("Error updating stock");
    } else {
      toast.success("Sale recorded successfully");
      setDialogOpen(false);
      setSelectedItem(null);
      fetchData();
    }
  };

  const recordDialog = (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogTrigger asChild>
        <Button disabled={items.length === 0} size="lg" className="shadow-md">
          <Plus className="mr-2 h-4 w-4" />
          Record Sale
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Record New Sale</DialogTitle>
          <DialogDescription>Stock updates automatically after each sale</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Select Item</Label>
              <Select
                onValueChange={(value) => {
                  const item = items.find((i) => i.id === value);
                  setSelectedItem(item);
                }}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose item to sell" />
                </SelectTrigger>
                <SelectContent>
                  {items.map((item) => (
                    <SelectItem key={item.id} value={item.id}>
                      {item.name} — {item.current_stock} {item.unit} left
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedItem && (
              <>
                <div className="flex gap-4 rounded-xl border bg-muted/40 p-4">
                  <EntityImage
                    type="inventory"
                    entityId={selectedItem.id}
                    fallback={getProductImage(selectedItem.name)}
                    className="h-16 w-16 rounded-lg"
                  />
                  <div className="space-y-1 text-sm">
                    <p className="font-semibold">{selectedItem.name}</p>
                    <p>
                      <span className="text-muted-foreground">Cost:</span>{" "}
                      {formatRs(Number(selectedItem.purchase_price))}
                    </p>
                    <p>
                      <span className="text-muted-foreground">Suggested:</span>{" "}
                      {formatRs(Number(selectedItem.selling_price))}
                    </p>
                    <p>
                      <span className="text-muted-foreground">Stock:</span>{" "}
                      {selectedItem.current_stock} {selectedItem.unit}
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="quantity">Quantity ({selectedItem.unit})</Label>
                  <Input
                    id="quantity"
                    name="quantity"
                    type="number"
                    step="0.01"
                    max={selectedItem.current_stock}
                    placeholder="0"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sale_price">Sale Price per {selectedItem.unit}</Label>
                  <Input
                    id="sale_price"
                    name="sale_price"
                    type="number"
                    step="0.01"
                    defaultValue={selectedItem.selling_price}
                    placeholder="0.00"
                    required
                  />
                </div>
              </>
            )}
          </div>
          <DialogFooter className="mt-6">
            <Button type="submit" disabled={!selectedItem} className="w-full sm:w-auto">
              Record Sale
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );

  if (loading) {
    return <PageLoader message="Loading sales..." />;
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Sales"
        description="Record transactions and track profit on every sale."
        action={recordDialog}
      />

      {items.length === 0 ? (
        <EmptyState
          image={images.emptyInventory}
          title="No stock to sell"
          description="Add inventory items with stock before recording sales."
        />
      ) : sales.length === 0 ? (
        <EmptyState
          image={images.emptySales}
          title="No sales yet"
          description="Record your first sale to start tracking revenue and profit."
          action={
            <EmptyStateButton onClick={() => setDialogOpen(true)}>
              <ShoppingCart className="mr-2 h-4 w-4" />
              Record Your First Sale
            </EmptyStateButton>
          }
        />
      ) : (
        <Card className="overflow-hidden shadow-card">
          <CardHeader className="border-b bg-muted/30">
            <CardTitle>Recent Sales</CardTitle>
            <CardDescription>Last {sales.length} transactions</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="w-14" />
                    <TableHead>Date</TableHead>
                    <TableHead>Item</TableHead>
                    <TableHead>Qty</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Profit</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sales.map((sale) => (
                    <TableRow key={sale.id} className="group">
                      <TableCell>
                        <EntityImage
                          type="inventory"
                          entityId={sale.inventory_item_id}
                          fallback={getProductImage(sale.inventory_items?.name || "")}
                          className="h-10 w-10 rounded-lg"
                        />
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-muted-foreground">
                        {format(new Date(sale.sale_date), "MMM dd, HH:mm")}
                      </TableCell>
                      <TableCell>
                        <p className="font-medium">{sale.inventory_items?.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {sale.inventory_items?.categories?.name}
                        </p>
                      </TableCell>
                      <TableCell>
                        {Number(sale.quantity).toFixed(2)} {sale.inventory_items?.unit}
                      </TableCell>
                      <TableCell className="font-medium">
                        {formatRs(Number(sale.total_amount))}
                      </TableCell>
                      <TableCell className="font-semibold text-success">
                        {formatRs(Number(sale.profit))}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
