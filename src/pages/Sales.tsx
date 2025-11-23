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
    const profit = totalAmount - (quantity * Number(selectedItem.purchase_price));

    // Insert sale
    const { error: saleError } = await supabase
      .from("sales")
      .insert({
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

    // Update inventory stock
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4" />
          <p className="text-muted-foreground">Loading sales...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Sales</h1>
          <p className="text-muted-foreground">Record and track your sales transactions</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button disabled={items.length === 0}>
              <Plus className="mr-2 h-4 w-4" />
              Record Sale
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Record New Sale</DialogTitle>
              <DialogDescription>
                Enter sale details to update inventory and track profit
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="item">Select Item</Label>
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
                          {item.name} - {item.categories?.name} (Stock: {item.current_stock} {item.unit})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedItem && (
                  <>
                    <div className="p-3 bg-muted rounded-lg space-y-1">
                      <p className="text-sm">
                        <span className="font-medium">Purchase Price:</span> Rs. {Number(selectedItem.purchase_price).toFixed(2)}
                      </p>
                      <p className="text-sm">
                        <span className="font-medium">Suggested Price:</span> Rs. {Number(selectedItem.selling_price).toFixed(2)}
                      </p>
                      <p className="text-sm">
                        <span className="font-medium">Available Stock:</span> {selectedItem.current_stock} {selectedItem.unit}
                      </p>
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
                      <Label htmlFor="sale_price">Sale Price per {selectedItem.unit} (Rs.)</Label>
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
                <Button type="submit" disabled={!selectedItem}>
                  Record Sale
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {items.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <ShoppingCart className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium">No items available</p>
            <p className="text-sm text-muted-foreground">Add inventory items first to record sales</p>
          </CardContent>
        </Card>
      ) : sales.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <ShoppingCart className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium">No sales yet</p>
            <p className="text-sm text-muted-foreground mb-4">Start recording your sales to track performance</p>
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Record Your First Sale
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Recent Sales</CardTitle>
            <CardDescription>Your latest sales transactions</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Item</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Sale Price</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Profit</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sales.map((sale) => (
                  <TableRow key={sale.id}>
                    <TableCell>
                      {format(new Date(sale.sale_date), "MMM dd, yyyy HH:mm")}
                    </TableCell>
                    <TableCell className="font-medium">
                      {sale.inventory_items?.name}
                    </TableCell>
                    <TableCell>{sale.inventory_items?.categories?.name}</TableCell>
                    <TableCell>
                      {Number(sale.quantity).toFixed(2)} {sale.inventory_items?.unit}
                    </TableCell>
                    <TableCell>Rs. {Number(sale.sale_price).toFixed(2)}</TableCell>
                    <TableCell className="font-medium">
                      Rs. {Number(sale.total_amount).toFixed(2)}
                    </TableCell>
                    <TableCell>
                      <span className="text-success font-medium">
                        Rs. {Number(sale.profit).toFixed(2)}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
