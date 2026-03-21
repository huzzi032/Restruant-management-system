import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  Utensils,
  Folder,
  TrendingUp,
  PlusCircle,
} from 'lucide-react';
import { menuService } from '@/services/api';
import { toast } from 'sonner';

export default function MenuManagement() {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [isAddItemOpen, setIsAddItemOpen] = useState(false);
  const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false);
  const [itemForm, setItemForm] = useState({
    name: '',
    description: '',
    price: '',
    cost: '',
    category_id: '',
    preparation_time: '15',
    image_url: '',
    is_vegetarian: false,
    is_spicy: false,
  });
  const [categoryForm, setCategoryForm] = useState({
    name: '',
    description: '',
  });
  const queryClient = useQueryClient();

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: () => menuService.getCategories(),
  });

  const { data: menuItems, isLoading: itemsLoading } = useQuery({
    queryKey: ['menu-items', selectedCategory, search],
    queryFn: () => menuService.getMenuItems({ 
      category_id: selectedCategory || undefined, 
      search: search || undefined 
    }),
  });

  const { data: topSelling } = useQuery({
    queryKey: ['menu-top-selling'],
    queryFn: () => menuService.getTopSelling({ limit: 10, days: 30 }),
  });

  const addCategoryMutation = useMutation({
    mutationFn: menuService.createCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      setIsAddCategoryOpen(false);
      setCategoryForm({ name: '', description: '' });
      toast.success('Category created successfully');
    },
    onError: (error: any) => toast.error(error.response?.data?.detail || 'Failed to create category'),
  });

  const addItemMutation = useMutation({
    mutationFn: menuService.createMenuItem,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menu-items'] });
      setIsAddItemOpen(false);
      setItemForm({
        name: '',
        description: '',
        price: '',
        cost: '',
        category_id: '',
        preparation_time: '15',
        image_url: '',
        is_vegetarian: false,
        is_spicy: false,
      });
      toast.success('Menu item created successfully');
    },
    onError: (error: any) => toast.error(error.response?.data?.detail || 'Failed to create item'),
  });

  const deleteMutation = useMutation({
    mutationFn: menuService.deleteMenuItem,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menu-items'] });
      toast.success('Item deleted successfully');
    },
    onError: () => toast.error('Failed to delete item'),
  });

  const toggleMutation = useMutation({
    mutationFn: menuService.toggleAvailability,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menu-items'] });
      toast.success('Availability updated');
    },
  });

  const handleAddCategory = () => {
    if (!categoryForm.name.trim()) {
      toast.error('Category name is required');
      return;
    }

    addCategoryMutation.mutate({
      name: categoryForm.name.trim(),
      description: categoryForm.description.trim() || undefined,
      is_active: true,
      sort_order: categories?.length || 0,
    });
  };

  const handleAddItem = () => {
    if (!itemForm.name.trim() || !itemForm.price || !itemForm.category_id) {
      toast.error('Name, price, and category are required');
      return;
    }

    addItemMutation.mutate({
      name: itemForm.name.trim(),
      description: itemForm.description.trim() || undefined,
      price: Number(itemForm.price),
      cost: Number(itemForm.cost || '0'),
      category_id: Number(itemForm.category_id),
      preparation_time: Number(itemForm.preparation_time || '15'),
      image_url: itemForm.image_url.trim() || undefined,
      is_available: true,
      is_vegetarian: itemForm.is_vegetarian,
      is_spicy: itemForm.is_spicy,
      ingredients: [],
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Menu Management</h1>
          <p className="text-muted-foreground mt-1">Manage your menu categories and items</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={isAddCategoryOpen} onOpenChange={setIsAddCategoryOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="gap-2">
                <PlusCircle className="h-4 w-4" />
                Add Category
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Category</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Name</Label>
                  <Input
                    value={categoryForm.name}
                    onChange={(e) => setCategoryForm((prev) => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g. Pasta"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Input
                    value={categoryForm.description}
                    onChange={(e) => setCategoryForm((prev) => ({ ...prev, description: e.target.value }))}
                    placeholder="Optional"
                  />
                </div>
                <Button className="w-full" onClick={handleAddCategory} disabled={addCategoryMutation.isPending}>
                  {addCategoryMutation.isPending ? 'Creating...' : 'Create Category'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={isAddItemOpen} onOpenChange={setIsAddItemOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Add Item
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Add New Menu Item</DialogTitle>
              </DialogHeader>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2 md:col-span-2">
                  <Label>Name</Label>
                  <Input
                    value={itemForm.name}
                    onChange={(e) => setItemForm((prev) => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g. Chicken Burger"
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Description</Label>
                  <Input
                    value={itemForm.description}
                    onChange={(e) => setItemForm((prev) => ({ ...prev, description: e.target.value }))}
                    placeholder="Short item description"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Price</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={itemForm.price}
                    onChange={(e) => setItemForm((prev) => ({ ...prev, price: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Cost</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={itemForm.cost}
                    onChange={(e) => setItemForm((prev) => ({ ...prev, cost: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Category</Label>
                  <select
                    className="w-full h-10 rounded-md border bg-background px-3"
                    value={itemForm.category_id}
                    onChange={(e) => setItemForm((prev) => ({ ...prev, category_id: e.target.value }))}
                  >
                    <option value="">Select category</option>
                    {categories?.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Prep Time (minutes)</Label>
                  <Input
                    type="number"
                    min="1"
                    value={itemForm.preparation_time}
                    onChange={(e) => setItemForm((prev) => ({ ...prev, preparation_time: e.target.value }))}
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Image URL</Label>
                  <Input
                    value={itemForm.image_url}
                    onChange={(e) => setItemForm((prev) => ({ ...prev, image_url: e.target.value }))}
                    placeholder="https://..."
                  />
                </div>
                <div className="md:col-span-2 flex gap-6">
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={itemForm.is_vegetarian}
                      onChange={(e) => setItemForm((prev) => ({ ...prev, is_vegetarian: e.target.checked }))}
                    />
                    Vegetarian
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={itemForm.is_spicy}
                      onChange={(e) => setItemForm((prev) => ({ ...prev, is_spicy: e.target.checked }))}
                    />
                    Spicy
                  </label>
                </div>
                <div className="md:col-span-2">
                  <Button className="w-full" onClick={handleAddItem} disabled={addItemMutation.isPending}>
                    {addItemMutation.isPending ? 'Adding...' : 'Add Menu Item'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs defaultValue="items" className="space-y-6">
        <TabsList>
          <TabsTrigger value="items" className="gap-2">
            <Utensils className="h-4 w-4" />
            Menu Items
          </TabsTrigger>
          <TabsTrigger value="categories" className="gap-2">
            <Folder className="h-4 w-4" />
            Categories
          </TabsTrigger>
          <TabsTrigger value="analytics" className="gap-2">
            <TrendingUp className="h-4 w-4" />
            Analytics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="items" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-wrap gap-4">
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search menu items..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    variant={selectedCategory === null ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedCategory(null)}
                  >
                    All
                  </Button>
                  {categories?.map((cat) => (
                    <Button
                      key={cat.id}
                      variant={selectedCategory === cat.id ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setSelectedCategory(cat.id)}
                    >
                      {cat.name}
                    </Button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Menu Items Table */}
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Cost</TableHead>
                    <TableHead>Margin</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {itemsLoading ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8">
                        Loading...
                      </TableCell>
                    </TableRow>
                  ) : menuItems?.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        No menu items found
                      </TableCell>
                    </TableRow>
                  ) : (
                    menuItems?.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            {item.image_url ? (
                              <img
                                src={item.image_url}
                                alt={item.name}
                                className="w-10 h-10 rounded-lg object-cover"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                                <Utensils className="h-5 w-5 text-muted-foreground" />
                              </div>
                            )}
                            <div>
                              <p className="font-medium">{item.name}</p>
                              <p className="text-xs text-muted-foreground line-clamp-1">
                                {item.description}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{item.category_name}</TableCell>
                        <TableCell>${item.price.toFixed(2)}</TableCell>
                        <TableCell>${item.cost.toFixed(2)}</TableCell>
                        <TableCell>
                          <Badge variant={item.profit_margin > 30 ? 'default' : 'secondary'}>
                            {item.profit_margin.toFixed(1)}%
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant={item.is_available ? 'default' : 'secondary'}
                            size="sm"
                            onClick={() => toggleMutation.mutate(item.id)}
                          >
                            {item.is_available ? 'Available' : 'Unavailable'}
                          </Button>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button variant="ghost" size="icon">
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => deleteMutation.mutate(item.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="categories">
          <Card>
            <CardHeader>
              <CardTitle>Categories</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {categories?.map((category) => (
                  <motion.div
                    key={category.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    whileHover={{ scale: 1.02 }}
                    className="p-4 rounded-lg border bg-card hover:shadow-md transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold">{category.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {category.item_count} items
                        </p>
                      </div>
                      <Badge variant={category.is_active ? 'default' : 'secondary'}>
                        {category.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics">
          <Card>
            <CardHeader>
              <CardTitle>Top Selling Items</CardTitle>
            </CardHeader>
            <CardContent>
              {!topSelling?.top_items?.length ? (
                <p className="text-muted-foreground">No sales data yet. Place some orders to see analytics.</p>
              ) : (
                <div className="space-y-3">
                  {topSelling.top_items.map((item: any, index: number) => (
                    <div key={`${item.menu_item_id}-${index}`} className="flex items-center justify-between rounded-lg border p-3">
                      <div>
                        <p className="font-medium">{index + 1}. {item.item_name}</p>
                        <p className="text-xs text-muted-foreground">Sold: {item.quantity_sold}</p>
                      </div>
                      <Badge variant="secondary">${Number(item.revenue || 0).toFixed(2)}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}
