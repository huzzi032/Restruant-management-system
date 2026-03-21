import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
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
  Package,
  Search,
  AlertTriangle,
  Plus,
  TrendingDown,
  TrendingUp,
  History,
} from 'lucide-react';
import { inventoryService } from '@/services/api';
import { toast } from 'sonner';

export default function Inventory() {
  const [search, setSearch] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newItem, setNewItem] = useState({
    name: '',
    description: '',
    quantity: '0',
    unit: 'pcs',
    cost_per_unit: '0',
    min_stock_level: '10',
    max_stock_level: '100',
    reorder_point: '20',
  });
  const queryClient = useQueryClient();

  const { data: items, isLoading } = useQuery({
    queryKey: ['inventory-items', search],
    queryFn: () => inventoryService.getItems({ search: search || undefined }),
  });

  const { data: lowStock } = useQuery({
    queryKey: ['low-stock'],
    queryFn: inventoryService.getLowStock,
  });

  const { data: inventoryValue } = useQuery({
    queryKey: ['inventory-value'],
    queryFn: inventoryService.getValue,
  });

  const createItemMutation = useMutation({
    mutationFn: inventoryService.createItem,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory-items'] });
      queryClient.invalidateQueries({ queryKey: ['low-stock'] });
      queryClient.invalidateQueries({ queryKey: ['inventory-value'] });
      setIsAddDialogOpen(false);
      setNewItem({
        name: '',
        description: '',
        quantity: '0',
        unit: 'pcs',
        cost_per_unit: '0',
        min_stock_level: '10',
        max_stock_level: '100',
        reorder_point: '20',
      });
      toast.success('Inventory item added successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to add inventory item');
    },
  });

  const handleCreateItem = () => {
    if (!newItem.name.trim()) {
      toast.error('Item name is required');
      return;
    }

    createItemMutation.mutate({
      name: newItem.name.trim(),
      description: newItem.description.trim() || undefined,
      quantity: Number(newItem.quantity || '0'),
      unit: newItem.unit.trim() || 'pcs',
      cost_per_unit: Number(newItem.cost_per_unit || '0'),
      min_stock_level: Number(newItem.min_stock_level || '0'),
      max_stock_level: Number(newItem.max_stock_level || '0'),
      reorder_point: Number(newItem.reorder_point || '0'),
      is_active: true,
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Inventory Management</h1>
          <p className="text-muted-foreground mt-1">Track and manage your stock</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 w-full sm:w-auto">
              <Plus className="h-4 w-4" />
              Add Item
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Add Inventory Item</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="sm:col-span-2 space-y-1">
                <Label>Name</Label>
                <Input
                  value={newItem.name}
                  onChange={(e) => setNewItem((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g. Chicken Breast"
                />
              </div>
              <div className="sm:col-span-2 space-y-1">
                <Label>Description</Label>
                <Input
                  value={newItem.description}
                  onChange={(e) => setNewItem((prev) => ({ ...prev, description: e.target.value }))}
                  placeholder="Optional description"
                />
              </div>
              <div className="space-y-1">
                <Label>Quantity</Label>
                <Input
                  type="number"
                  min="0"
                  value={newItem.quantity}
                  onChange={(e) => setNewItem((prev) => ({ ...prev, quantity: e.target.value }))}
                />
              </div>
              <div className="space-y-1">
                <Label>Unit</Label>
                <Input
                  value={newItem.unit}
                  onChange={(e) => setNewItem((prev) => ({ ...prev, unit: e.target.value }))}
                  placeholder="pcs / kg / ltr"
                />
              </div>
              <div className="space-y-1">
                <Label>Cost Per Unit</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={newItem.cost_per_unit}
                  onChange={(e) => setNewItem((prev) => ({ ...prev, cost_per_unit: e.target.value }))}
                />
              </div>
              <div className="space-y-1">
                <Label>Min Stock</Label>
                <Input
                  type="number"
                  min="0"
                  value={newItem.min_stock_level}
                  onChange={(e) => setNewItem((prev) => ({ ...prev, min_stock_level: e.target.value }))}
                />
              </div>
              <div className="space-y-1">
                <Label>Max Stock</Label>
                <Input
                  type="number"
                  min="0"
                  value={newItem.max_stock_level}
                  onChange={(e) => setNewItem((prev) => ({ ...prev, max_stock_level: e.target.value }))}
                />
              </div>
              <div className="space-y-1">
                <Label>Reorder Point</Label>
                <Input
                  type="number"
                  min="0"
                  value={newItem.reorder_point}
                  onChange={(e) => setNewItem((prev) => ({ ...prev, reorder_point: e.target.value }))}
                />
              </div>
              <div className="sm:col-span-2 pt-2">
                <Button className="w-full" onClick={handleCreateItem} disabled={createItemMutation.isPending}>
                  {createItemMutation.isPending ? 'Adding...' : 'Add Item'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <Package className="h-6 w-6 text-blue-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Items</p>
              <p className="text-2xl font-bold">{items?.length || 0}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-yellow-500/10 flex items-center justify-center">
              <AlertTriangle className="h-6 w-6 text-yellow-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Low Stock</p>
              <p className="text-2xl font-bold">{lowStock?.count || 0}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-green-500/10 flex items-center justify-center">
              <TrendingUp className="h-6 w-6 text-green-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Value</p>
              <p className="text-2xl font-bold">${inventoryValue?.total_value?.toFixed(2) || '0.00'}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="items" className="space-y-4">
        <TabsList className="w-full overflow-x-auto justify-start">
          <TabsTrigger value="items" className="gap-2">
            <Package className="h-4 w-4" />
            All Items
          </TabsTrigger>
          <TabsTrigger value="low-stock" className="gap-2">
            <AlertTriangle className="h-4 w-4" />
            Low Stock
          </TabsTrigger>
          <TabsTrigger value="transactions" className="gap-2">
            <History className="h-4 w-4" />
            Transactions
          </TabsTrigger>
        </TabsList>

        <TabsContent value="items">
          <Card>
            <CardContent className="p-4">
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search inventory items..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Unit</TableHead>
                    <TableHead>Cost/Unit</TableHead>
                    <TableHead>Stock Value</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8">
                        Loading...
                      </TableCell>
                    </TableRow>
                  ) : items?.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        No items found
                      </TableCell>
                    </TableRow>
                  ) : (
                    items?.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{item.name}</p>
                            <p className="text-xs text-muted-foreground">{item.description}</p>
                          </div>
                        </TableCell>
                        <TableCell>{item.quantity}</TableCell>
                        <TableCell>{item.unit}</TableCell>
                        <TableCell>${item.cost_per_unit.toFixed(2)}</TableCell>
                        <TableCell>${item.stock_value.toFixed(2)}</TableCell>
                        <TableCell>
                          <Badge variant={item.is_low_stock ? 'destructive' : 'default'}>
                            {item.stock_status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="low-stock">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="h-5 w-5" />
                Low Stock Items
              </CardTitle>
            </CardHeader>
            <CardContent>
              {lowStock?.low_stock_items?.length === 0 ? (
                <p className="text-center py-8 text-muted-foreground">
                  No low stock items
                </p>
              ) : (
                <div className="space-y-3">
                  {lowStock?.low_stock_items?.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-4 rounded-lg border border-destructive/20 bg-destructive/5"
                    >
                      <div>
                        <p className="font-medium">{item.name}</p>
                        <p className="text-sm text-muted-foreground">
                          Current: {item.quantity} {item.unit} | Min: {item.min_stock_level} {item.unit}
                        </p>
                      </div>
                      <Button size="sm" variant="outline">
                        <TrendingDown className="h-4 w-4 mr-2" />
                        Restock
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="transactions">
          <Card>
            <CardHeader>
              <CardTitle>Recent Transactions</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Transaction history coming soon...</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}
