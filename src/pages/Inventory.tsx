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
import { Plus, Edit, Trash2, AlertTriangle } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PageHeader } from "@/components/PageHeader";
import { PageLoader } from "@/components/PageLoader";
import { EmptyState, EmptyStateButton } from "@/components/EmptyState";
import { formatRs } from "@/lib/format";
import { images, getProductImage } from "@/lib/images";
import { EntityImage } from "@/components/EntityImage";
import { ImageUploadField } from "@/components/ImageUploadField";
import { removeLocalImage, saveLocalImage } from "@/lib/localImages";

export default function Inventory() {
  const { user } = useAuth();
  const [items, setItems] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [pendingImage, setPendingImage] = useState<File | null>(null);

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
        setPendingImage(null);
        fetchData();
      }
    } else {
      const { data, error } = await supabase
        .from("inventory_items")
        .insert(itemData)
        .select()
        .single();

      if (error) {
        toast.error(error.message);
      } else {
        if (data && pendingImage && user?.id) {
          await saveLocalImage(user.id, "inventory", data.id, pendingImage);
        }
        toast.success("Item added successfully");
        setDialogOpen(false);
        setPendingImage(null);
        fetchData();
      }
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this item?")) {
      const { error } = await supabase.from("inventory_items").delete().eq("id", id);

      if (error) {
        toast.error("Error deleting item");
      } else {
        if (user?.id) {
          await removeLocalImage(user.id, "inventory", id);
        }
        toast.success("Item deleted successfully");
        fetchData();
      }
    }
  };

  const dialog = (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogTrigger asChild>
        <Button
          onClick={() => {
            setEditingItem(null);
            setPendingImage(null);
          }}
          disabled={categories.length === 0}
          size="lg"
          className="shadow-md"
        >
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
          <div className="space-y-4">
            <ImageUploadField
              type="inventory"
              entityId={editingItem?.id}
              fallback={images.productFallback}
              onPendingFile={setPendingImage}
            />
          </div>
          <div className="grid grid-cols-2 gap-4 mt-4">
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
            <div className="col-span-2 space-y-2">
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
            <Button type="submit">{editingItem ? "Update" : "Add"} Item</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );

  if (loading) {
    return <PageLoader message="Loading inventory..." />;
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Inventory"
        description="Track stock levels, prices, and low-stock alerts for every product."
        action={dialog}
      />

      {categories.length === 0 ? (
        <EmptyState
          image={images.emptyCategories}
          title="Add categories first"
          description="Create product categories before adding inventory items."
        />
      ) : items.length === 0 ? (
        <EmptyState
          image={images.emptyInventory}
          title="No items yet"
          description="Add your first product to start tracking stock and sales."
          action={
            <EmptyStateButton onClick={() => setDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Your First Item
            </EmptyStateButton>
          }
        />
      ) : (
        <Card className="overflow-hidden shadow-card">
          <CardHeader className="border-b bg-muted/30">
            <CardTitle>All Items</CardTitle>
            <CardDescription>{items.length} products in stock</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="w-14" />
                    <TableHead>Product</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Stock</TableHead>
                    <TableHead>Cost</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item) => {
                    const isLowStock = item.current_stock <= item.minimum_stock;
                    return (
                      <TableRow key={item.id} className="group">
                        <TableCell>
                          <EntityImage
                            type="inventory"
                            entityId={item.id}
                            fallback={getProductImage(item.name)}
                            className="h-10 w-10 rounded-lg ring-2 ring-background transition-transform group-hover:scale-105"
                          />
                        </TableCell>
                        <TableCell className="font-medium">{item.name}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {item.categories?.name}
                        </TableCell>
                        <TableCell>
                          {item.current_stock} {item.unit}
                        </TableCell>
                        <TableCell>{formatRs(Number(item.purchase_price))}</TableCell>
                        <TableCell>{formatRs(Number(item.selling_price))}</TableCell>
                        <TableCell>
                          {isLowStock ? (
                            <Badge variant="destructive" className="gap-1">
                              <AlertTriangle className="h-3 w-3" />
                              Low
                            </Badge>
                          ) : (
                            <Badge className="bg-success/15 text-success hover:bg-success/20">
                              In Stock
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setEditingItem(item);
                                setPendingImage(null);
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
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
