import { useEffect, useRef, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Search,
  Plus,
  Minus,
  ShoppingCart,
  Trash2,
  Table,
  ChefHat,
  Clock,
  Check,
  X,
} from 'lucide-react';
import { menuService, tableService, orderService, kitchenService, resolveMediaUrl } from '@/services/api';
import { toast } from 'sonner';
import type { MenuItem } from '@/types';
import { useAuth } from '@/contexts/AuthContext';

interface CartItem {
  menu_item_id: number;
  name: string;
  price: number;
  quantity: number;
  special_instructions?: string;
}

export default function OrderTaking() {
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedTable, setSelectedTable] = useState<number | null>(null);
  const [selectedOrderToEdit, setSelectedOrderToEdit] = useState<number | null>(null);
  const [orderType, setOrderType] = useState<'dine_in' | 'takeaway'>('dine_in');
  const [lastCreatedOrderNumber, setLastCreatedOrderNumber] = useState<string | null>(null);
  const [isAddTableOpen, setIsAddTableOpen] = useState(false);
  const [tableForm, setTableForm] = useState({
    table_number: '',
    capacity: '4',
    location: '',
  });
  const queryClient = useQueryClient();

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: () => menuService.getCategories(),
  });

  const { data: menuItems } = useQuery({
    queryKey: ['menu-items', selectedCategory, search],
    queryFn: () => menuService.getMenuItems({
      category_id: selectedCategory || undefined,
      search: search || undefined,
      available_only: true,
    }),
  });

  const { data: tables } = useQuery({
    queryKey: ['available-tables'],
    queryFn: () => tableService.getAvailableTables(),
  });

  const { data: activeOrders } = useQuery({
    queryKey: ['active-orders'],
    queryFn: orderService.getActiveOrders,
    refetchInterval: 3000,
  });

  const { data: readyOrders } = useQuery({
    queryKey: ['ready-kitchen-orders'],
    queryFn: kitchenService.getReadyOrders,
    refetchInterval: 3000,
  });

  const previousReadyOrderIds = useRef<string>('');

  useEffect(() => {
    const currentIds = (readyOrders || []).map((order) => order.id).sort((a, b) => a - b);
    const currentKey = currentIds.join(',');
    const previousIds = previousReadyOrderIds.current
      ? previousReadyOrderIds.current.split(',').filter(Boolean).map(Number)
      : [];

    if (previousReadyOrderIds.current && currentIds.length > previousIds.length) {
      const added = currentIds.filter((id) => !previousIds.includes(id));
      const addedOrders = (readyOrders || []).filter((order) => added.includes(order.id));
      for (const order of addedOrders) {
        toast.info(`Order ${order.order_number} is ready. A waiter should pick it up.`);
      }
    }

    previousReadyOrderIds.current = currentKey;
  }, [readyOrders]);

  const createOrderMutation = useMutation({
    mutationFn: orderService.createOrder,
    onSuccess: (createdOrder) => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['active-orders'] });
      queryClient.invalidateQueries({ queryKey: ['billing-orders'] });
      queryClient.invalidateQueries({ queryKey: ['kitchen-orders'] });
      queryClient.invalidateQueries({ queryKey: ['kitchen-stats'] });
      queryClient.invalidateQueries({ queryKey: ['available-tables'] });
      setCart([]);
      setSelectedTable(null);
      setLastCreatedOrderNumber(createdOrder.order_number);
      toast.success(`Order ${createdOrder.order_number} created successfully`);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to create order');
    },
  });

  const createTableMutation = useMutation({
    mutationFn: tableService.createTable,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['available-tables'] });
      setIsAddTableOpen(false);
      setTableForm({ table_number: '', capacity: '4', location: '' });
      toast.success('Table added successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to add table');
    },
  });

  const addItemsToOrderMutation = useMutation({
    mutationFn: async (orderId: number) => {
      let latestOrder: any = null;
      for (const item of cart) {
        latestOrder = await orderService.addItem(orderId, {
          menu_item_id: item.menu_item_id,
          quantity: item.quantity,
          special_instructions: item.special_instructions,
        });
      }
      return latestOrder;
    },
    onSuccess: (updatedOrder) => {
      if (updatedOrder) {
        queryClient.setQueryData(['active-orders'], (oldData: any) => {
          if (!Array.isArray(oldData)) return oldData;
          return oldData.map((order) =>
            order.id === updatedOrder.id ? updatedOrder : order
          );
        });
      }
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['active-orders'] });
      queryClient.invalidateQueries({ queryKey: ['kitchen-orders'] });
      queryClient.invalidateQueries({ queryKey: ['kitchen-stats'] });
      setCart([]);
      toast.success('Items added to order successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to modify order');
    },
  });

  const removeItemMutation = useMutation({
    mutationFn: ({ orderId, itemId }: { orderId: number; itemId: number }) =>
      orderService.removeItem(orderId, itemId),
    onSuccess: (updatedOrder) => {
      queryClient.setQueryData(['active-orders'], (oldData: any) => {
        if (!Array.isArray(oldData)) return oldData;
        return oldData.map((order) =>
          order.id === updatedOrder.id ? updatedOrder : order
        );
      });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['active-orders'] });
      queryClient.invalidateQueries({ queryKey: ['kitchen-orders'] });
      queryClient.invalidateQueries({ queryKey: ['kitchen-stats'] });
      toast.success('Item removed from order');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to remove item');
    },
  });

  const pickupOrderMutation = useMutation({
    mutationFn: kitchenService.pickupOrder,
    onSuccess: (updatedOrder) => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['active-orders'] });
      queryClient.invalidateQueries({ queryKey: ['kitchen-orders'] });
      queryClient.invalidateQueries({ queryKey: ['kitchen-stats'] });
      toast.success(`Order ${updatedOrder.order_number} picked up from kitchen`);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to pick up order');
    },
  });

  const addToCart = (item: MenuItem) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.menu_item_id === item.id);
      if (existing) {
        return prev.map((i) =>
          i.menu_item_id === item.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [...prev, {
        menu_item_id: item.id,
        name: item.name,
        price: item.price,
        quantity: 1,
      }];
    });
  };

  const updateQuantity = (menuItemId: number, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) =>
          item.menu_item_id === menuItemId
            ? { ...item, quantity: Math.max(0, item.quantity + delta) }
            : item
        )
        .filter((item) => item.quantity > 0)
    );
  };

  const removeFromCart = (menuItemId: number) => {
    setCart((prev) => prev.filter((item) => item.menu_item_id !== menuItemId));
  };

  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const handleCheckout = () => {
    if (cart.length === 0) {
      toast.error('Cart is empty');
      return;
    }
    if (orderType === 'dine_in' && !selectedTable) {
      toast.error('Please select a table');
      return;
    }

    createOrderMutation.mutate({
      order_type: orderType,
      table_id: selectedTable || undefined,
      items: cart.map((item) => ({
        menu_item_id: item.menu_item_id,
        quantity: item.quantity,
        special_instructions: item.special_instructions,
      })),
    });
  };

  const handleModifyOrder = () => {
    if (!selectedOrderToEdit) {
      toast.error('Select an active order to modify');
      return;
    }
    if (cart.length === 0) {
      toast.error('Add items to cart first');
      return;
    }
    addItemsToOrderMutation.mutate(selectedOrderToEdit);
  };

  const selectedActiveOrder = activeOrders?.find((order) => order.id === selectedOrderToEdit);
  const myPickedOrders = (activeOrders || []).filter(
    (order) => order.picked_up_by === user?.id && order.status === 'served'
  );

  const handleCreateTable = () => {
    if (!tableForm.table_number.trim()) {
      toast.error('Table number is required');
      return;
    }

    createTableMutation.mutate({
      table_number: tableForm.table_number.trim(),
      capacity: Number(tableForm.capacity || '4'),
      location: tableForm.location.trim() || undefined,
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-[calc(100vh-4rem)] grid grid-cols-1 xl:grid-cols-[1fr_24rem] gap-4 md:gap-6"
    >
      {/* Left Panel - Menu */}
      <div className="flex-1 flex flex-col space-y-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold">New Order</h1>
            <p className="text-muted-foreground mt-1">Select items to add to order</p>
            {lastCreatedOrderNumber && (
              <p className="text-sm mt-1 text-primary">
                Last order token: {lastCreatedOrderNumber}
              </p>
            )}
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button
              variant={orderType === 'dine_in' ? 'default' : 'outline'}
              onClick={() => setOrderType('dine_in')}
            >
              <Table className="h-4 w-4 mr-2" />
              Dine In
            </Button>
            <Button
              variant={orderType === 'takeaway' ? 'default' : 'outline'}
              onClick={() => setOrderType('takeaway')}
            >
              <ShoppingCart className="h-4 w-4 mr-2" />
              Takeaway
            </Button>
          </div>
        </div>

        {/* Table Selection */}
        {orderType === 'dine_in' && (
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-medium">Select Table</p>
                <Dialog open={isAddTableOpen} onOpenChange={setIsAddTableOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-1">
                      <Plus className="h-3.5 w-3.5" />
                      Add Table
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Create Table</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-3">
                      <div className="space-y-1">
                        <p className="text-sm font-medium">Table Number</p>
                        <Input
                          value={tableForm.table_number}
                          onChange={(e) => setTableForm((prev) => ({ ...prev, table_number: e.target.value }))}
                          placeholder="e.g. T7"
                        />
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-medium">Capacity</p>
                        <Input
                          type="number"
                          min="1"
                          value={tableForm.capacity}
                          onChange={(e) => setTableForm((prev) => ({ ...prev, capacity: e.target.value }))}
                        />
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-medium">Location</p>
                        <Input
                          value={tableForm.location}
                          onChange={(e) => setTableForm((prev) => ({ ...prev, location: e.target.value }))}
                          placeholder="Indoor / Outdoor"
                        />
                      </div>
                      <Button className="w-full" onClick={handleCreateTable} disabled={createTableMutation.isPending}>
                        {createTableMutation.isPending ? 'Adding...' : 'Add Table'}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              <div className="flex flex-wrap gap-2">
                {tables?.length ? tables.map((table) => (
                  <Button
                    key={table.id}
                    variant={selectedTable === table.id ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedTable(table.id)}
                  >
                    Table {table.table_number}
                    <span className="ml-2 text-xs opacity-70">({table.capacity} seats)</span>
                  </Button>
                )) : (
                  <p className="text-sm text-muted-foreground">No available tables. Add a table to continue with dine-in orders.</p>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:justify-between mb-3">
              <p className="text-sm font-medium">Modify Existing Order</p>
              <Badge variant="secondary">{activeOrders?.length || 0} active</Badge>
            </div>

            <div className="mb-4">
              <p className="text-xs font-medium text-muted-foreground mb-2">Ready Orders For Pickup</p>
              <div className="flex flex-wrap gap-2">
                {readyOrders?.length ? readyOrders.map((order) => (
                  <Button
                    key={`ready-${order.id}`}
                    size="sm"
                    variant="secondary"
                    disabled={pickupOrderMutation.isPending}
                    onClick={() => pickupOrderMutation.mutate(order.id)}
                  >
                    <ChefHat className="h-3.5 w-3.5 mr-1" />
                    Accept & Pickup {order.order_number}
                  </Button>
                )) : (
                  <p className="text-sm text-muted-foreground">No ready orders waiting for pickup</p>
                )}
              </div>
            </div>

            <div className="mb-4">
              <p className="text-xs font-medium text-muted-foreground mb-2">My Picked Orders</p>
              <div className="flex flex-wrap gap-2">
                {myPickedOrders.length ? myPickedOrders.map((order) => (
                  <Badge key={`mine-${order.id}`} variant="outline">
                    {order.order_number} • Table {order.table_number || 'N/A'}
                  </Badge>
                )) : (
                  <p className="text-sm text-muted-foreground">No picked orders assigned to you yet</p>
                )}
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {activeOrders?.length ? activeOrders.map((order) => (
                <Button
                  key={order.id}
                  variant={selectedOrderToEdit === order.id ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedOrderToEdit(order.id)}
                >
                  {order.order_number}
                </Button>
              )) : (
                <p className="text-sm text-muted-foreground">No active orders available</p>
              )}
            </div>

            {selectedActiveOrder && (
              <div className="mt-3 space-y-2">
                <p className="text-xs text-muted-foreground">
                  Selected: {selectedActiveOrder.order_number} ({selectedActiveOrder.status.replace('_', ' ')})
                </p>
                <div className="space-y-2">
                  {selectedActiveOrder.items.filter((item) => !item.is_voided).map((item) => (
                    <div key={item.id} className="flex items-center justify-between rounded-md border p-2">
                      <p className="text-sm">{item.quantity}x {item.menu_item_name}</p>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-destructive"
                        disabled={removeItemMutation.isPending}
                        onClick={() => removeItemMutation.mutate({ orderId: selectedActiveOrder.id, itemId: item.id })}
                      >
                        Remove
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Search and Categories */}
        <Card>
          <CardContent className="p-4">
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search menu items..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex flex-wrap gap-2">
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
          </CardContent>
        </Card>

        {/* Menu Items Grid */}
        <ScrollArea className="h-[40vh] xl:h-[calc(100vh-24rem)]">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 pb-4">
            {menuItems?.map((item) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Card
                  className="cursor-pointer hover:shadow-lg transition-all overflow-hidden group"
                  onClick={() => addToCart(item)}
                >
                  <div className="aspect-video bg-muted relative overflow-hidden">
                    {item.image_url ? (
                      <img
                        src={resolveMediaUrl(item.image_url)}
                        alt={item.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ShoppingCart className="h-8 w-8 text-muted-foreground" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                  </div>
                  <CardContent className="p-3">
                    <h3 className="font-semibold text-sm line-clamp-1">{item.name}</h3>
                    <p className="text-lg font-bold text-primary mt-1">
                      {item.price.toFixed(2)}
                    </p>
                    <p className="text-xs text-muted-foreground line-clamp-1">
                      {item.category_name}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Right Panel - Cart */}
      <Card className="w-full xl:w-96 flex flex-col">
        <CardHeader className="border-b">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              Order Summary
            </CardTitle>
            <Badge variant="secondary">{cartCount} items</Badge>
          </div>
        </CardHeader>

        <ScrollArea className="flex-1">
          <CardContent className="p-4 space-y-3">
            <AnimatePresence>
              {cart.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-8 text-muted-foreground"
                >
                  <ShoppingCart className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>Your cart is empty</p>
                  <p className="text-sm">Click on items to add them</p>
                </motion.div>
              ) : (
                cart.map((item) => (
                  <motion.div
                    key={item.menu_item_id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="flex items-center gap-3 p-3 rounded-lg bg-muted/50"
                  >
                    <div className="flex-1">
                      <p className="font-medium text-sm">{item.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {item.price.toFixed(2)} each
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => updateQuantity(item.menu_item_id, -1)}
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="w-8 text-center font-medium">{item.quantity}</span>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => updateQuantity(item.menu_item_id, 1)}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive"
                        onClick={() => removeFromCart(item.menu_item_id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </CardContent>
        </ScrollArea>

        <div className="border-t p-4 space-y-4">
          <div className="flex items-center justify-between text-lg">
            <span className="font-medium">Total</span>
            <span className="font-bold text-primary">{cartTotal.toFixed(2)}</span>
          </div>
          <Button
            className="w-full h-12 text-lg font-semibold"
            disabled={cart.length === 0 || createOrderMutation.isPending}
            onClick={handleCheckout}
          >
            {createOrderMutation.isPending ? (
              <>
                <Clock className="h-5 w-5 mr-2 animate-spin" />
                Creating Order...
              </>
            ) : (
              <>
                <Check className="h-5 w-5 mr-2" />
                Place Order
              </>
            )}
          </Button>
          <Button
            variant="outline"
            className="w-full"
            disabled={cart.length === 0 || !selectedOrderToEdit || addItemsToOrderMutation.isPending}
            onClick={handleModifyOrder}
          >
            {addItemsToOrderMutation.isPending ? 'Updating Order...' : 'Add Cart To Selected Order'}
          </Button>
        </div>
      </Card>
    </motion.div>
  );
}
