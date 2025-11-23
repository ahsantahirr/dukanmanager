import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Plus, Edit, Trash2, Package, AlertTriangle } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default function Inventory() {
  const { user } = useAuth();
  const [items, setItems] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    const [itemsRes, categoriesRes] = await Promise.all([
      supabase
        .from("inventory_items")
        .select("*, categories(name)")
        .eq("user_id", user?.id)
        .order("created_at", { ascending: false }),
      supabase
        .from("categories")
        .select("*")
        .eq("user_id", user?.id)
        .order("name"),
    ]);

    if (itemsRes.error) {
      toast.error("Error fetching inventory");
    } else {
      setItems(itemsRes.data || []);
    }

    if (categoriesRes.error) {
      toast.error("Error fetching categories");
    } else {
      setCategories(categoriesRes.data || []);
    }

    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const itemData = {
      category_id: formData.get("category_id") as string,
      name: formData.get("name") as string,
      purchase_price: parseFloat(formData.get("purchase_price") as string),
      selling_price: parseFloat(formData.get("selling_price") as string),
      current_stock: parseInt(formData.get("current_stock") as string),
      minimum_stock: parseInt(formData.get("minimum_stock") as string),
      unit: formData.get("unit") as string,
      user_id: user?.id,
    };

    if (editingItem) {
      const { error } = await supabase
        .from("inventory_items")
        .update(itemData)
        .eq("id", editingItem.id);

      if (error) {
        toast.error("Error updating item");
      } else {
        toast.success("Item updated successfully");
        setDialogOpen(false);
        setEditingItem(null);
        fetchData();
      }
    } else {
      const { error } = await supabase
        .from("inventory_items")
        .insert(itemData);

      if (error) {
        toast.error(error.message);
      } else {
        toast.success("Item added successfully");
        setDialogOpen(false);
        fetchData();
      }
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this item?")) {
      const { error } = await supabase
        .from("inventory_items")
        .delete()
        .eq("id", id);

      if (error) {
        toast.error("Error deleting item");
      } else {
        toast.success("Item deleted successfully");
        fetchData();
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4" />
          <p className="text-muted-foreground">Loading inventory...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Inventory</h1>
          <p className="text-muted-foreground">Manage your stock and products</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditingItem(null)} disabled={categories.length === 0}>
              <Plus className="mr-2 h-4 w-4" />
              Add Item
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingItem ? "Edit Item" : "Add New Item"}</DialogTitle>
              <DialogDescription>
                {editingItem ? "Update item details" : "Add a new product to your inventory"}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category_id">Category</Label>
                  <Select name="category_id" defaultValue={editingItem?.category_id} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="name">Product Name</Label>
                  <Input
                    id="name"
                    name="name"
                    placeholder="e.g., Super Basmati"
                    defaultValue={editingItem?.name}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="purchase_price">Purchase Price (Rs.)</Label>
                  <Input
                    id="purchase_price"
                    name="purchase_price"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    defaultValue={editingItem?.purchase_price}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="selling_price">Selling Price (Rs.)</Label>
                  <Input
                    id="selling_price"
                    name="selling_price"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    defaultValue={editingItem?.selling_price}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="current_stock">Current Stock</Label>
                  <Input
                    id="current_stock"
                    name="current_stock"
                    type="number"
                    placeholder="0"
                    defaultValue={editingItem?.current_stock}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="minimum_stock">Minimum Stock</Label>
                  <Input
                    id="minimum_stock"
                    name="minimum_stock"
                    type="number"
                    placeholder="10"
                    defaultValue={editingItem?.minimum_stock}
                    required
                  />
                </div>
                <div className="space-y-2 col-span-2">
                  <Label htmlFor="unit">Unit</Label>
                  <Input
                    id="unit"
                    name="unit"
                    placeholder="kg, liter, piece, etc."
                    defaultValue={editingItem?.unit || "kg"}
                    required
                  />
                </div>
              </div>
              <DialogFooter className="mt-6">
                <Button type="submit">
                  {editingItem ? "Update" : "Add"} Item
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {categories.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Package className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium">No categories available</p>
            <p className="text-sm text-muted-foreground mb-4">Please add categories first before adding inventory items</p>
          </CardContent>
        </Card>
      ) : items.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Package className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium">No items yet</p>
            <p className="text-sm text-muted-foreground mb-4">Start by adding your first inventory item</p>
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Your First Item
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>All Items</CardTitle>
            <CardDescription>Complete list of your inventory items</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead>Purchase Price</TableHead>
                  <TableHead>Selling Price</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => {
                  const isLowStock = item.current_stock <= item.minimum_stock;
                  return (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell>{item.categories?.name}</TableCell>
                      <TableCell>
                        {item.current_stock} {item.unit}
                      </TableCell>
                      <TableCell>Rs. {Number(item.purchase_price).toFixed(2)}</TableCell>
                      <TableCell>Rs. {Number(item.selling_price).toFixed(2)}</TableCell>
                      <TableCell>
                        {isLowStock ? (
                          <Badge variant="destructive" className="gap-1">
                            <AlertTriangle className="h-3 w-3" />
                            Low Stock
                          </Badge>
                        ) : (
                          <Badge variant="secondary">In Stock</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setEditingItem(item);
                              setDialogOpen(true);
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDelete(item.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
