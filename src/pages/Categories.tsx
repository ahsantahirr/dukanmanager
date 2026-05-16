import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Plus, Edit, Trash2, FolderOpen } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { PageLoader } from "@/components/PageLoader";
import { EmptyState, EmptyStateButton } from "@/components/EmptyState";
import { images, getCategoryFallback } from "@/lib/images";
import { EntityImage } from "@/components/EntityImage";
import { ImageUploadField } from "@/components/ImageUploadField";
import { removeLocalImage, saveLocalImage } from "@/lib/localImages";

export default function Categories() {
  const { user } = useAuth();
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any>(null);
  const [pendingImage, setPendingImage] = useState<File | null>(null);

  useEffect(() => {
    if (user) {
      fetchCategories();
    }
  }, [user]);

  const fetchCategories = async () => {
    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .eq("user_id", user?.id)
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Error fetching categories");
    } else {
      setCategories(data || []);
    }
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const name = formData.get("name") as string;
    const description = formData.get("description") as string;

    if (editingCategory) {
      const { error } = await supabase
        .from("categories")
        .update({ name, description })
        .eq("id", editingCategory.id);

      if (error) {
        toast.error("Error updating category");
      } else {
        toast.success("Category updated successfully");
        setDialogOpen(false);
        setEditingCategory(null);
        setPendingImage(null);
        fetchCategories();
      }
    } else {
      const { data, error } = await supabase
        .from("categories")
        .insert({ name, description, user_id: user?.id })
        .select()
        .single();

      if (error) {
        toast.error(error.message);
      } else {
        if (data && pendingImage && user?.id) {
          await saveLocalImage(user.id, "category", data.id, pendingImage);
        }
        toast.success("Category added successfully");
        setDialogOpen(false);
        setPendingImage(null);
        fetchCategories();
      }
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this category? All related inventory items will also be deleted.")) {
      const { error } = await supabase
        .from("categories")
        .delete()
        .eq("id", id);

      if (error) {
        toast.error("Error deleting category");
      } else {
        if (user?.id) {
          await removeLocalImage(user.id, "category", id);
        }
        toast.success("Category deleted successfully");
        fetchCategories();
      }
    }
  };

  const openAdd = () => {
    setEditingCategory(null);
    setPendingImage(null);
    setDialogOpen(true);
  };

  if (loading) {
    return <PageLoader message="Loading categories..." />;
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Categories"
        description="Organize products into groups — rice, grocery, cosmetics, and more."
        action={
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => setEditingCategory(null)} size="lg" className="shadow-md">
                <Plus className="mr-2 h-4 w-4" />
                Add Category
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingCategory ? "Edit Category" : "Add New Category"}</DialogTitle>
                <DialogDescription>
                  {editingCategory ? "Update category details" : "Create a new product category"}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit}>
                <div className="space-y-4">
                  <ImageUploadField
                    type="category"
                    entityId={editingCategory?.id}
                    fallback={images.emptyCategories}
                    onPendingFile={setPendingImage}
                  />
                  <div className="space-y-2">
                    <Label htmlFor="name">Category Name</Label>
                    <Input
                      id="name"
                      name="name"
                      placeholder="e.g., Basmati Rice"
                      defaultValue={editingCategory?.name}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Description (Optional)</Label>
                    <Textarea
                      id="description"
                      name="description"
                      placeholder="Brief description of this category"
                      defaultValue={editingCategory?.description}
                      rows={3}
                    />
                  </div>
                </div>
                <DialogFooter className="mt-6">
                  <Button type="submit">
                    {editingCategory ? "Update" : "Add"} Category
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        }
      />

      {categories.length === 0 ? (
        <EmptyState
          image={images.emptyCategories}
          title="No categories yet"
          description="Categories help you organize inventory — start with rice, grocery, or cosmetics."
          action={
            <EmptyStateButton onClick={openAdd}>
              <Plus className="mr-2 h-4 w-4" />
              Add Your First Category
            </EmptyStateButton>
          }
        />
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((category, index) => (
            <Card key={category.id} className="group overflow-hidden shadow-card transition-all hover:shadow-soft">
              <div className="relative h-36 overflow-hidden">
                <EntityImage
                  type="category"
                  entityId={category.id}
                  fallback={getCategoryFallback(index)}
                  className="h-full w-full transition-transform duration-300 group-hover:scale-105"
                />
                <div className="image-overlay" />
                <div className="absolute bottom-3 left-3 right-3">
                  <CardTitle className="flex items-center gap-2 text-lg text-white drop-shadow">
                    <FolderOpen className="h-5 w-5" />
                    {category.name}
                  </CardTitle>
                </div>
              </div>
              <CardHeader className="pb-2 pt-4">
                {category.description ? (
                  <CardDescription className="line-clamp-2">{category.description}</CardDescription>
                ) : (
                  <CardDescription className="italic">No description</CardDescription>
                )}
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => {
                      setEditingCategory(category);
                      setPendingImage(null);
                      setDialogOpen(true);
                    }}
                  >
                    <Edit className="mr-1 h-4 w-4" />
                    Edit
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDelete(category.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
