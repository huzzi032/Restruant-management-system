import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ChefHat,
  Clock,
  CheckCircle2,
  Flame,
  AlertCircle,
  Timer,
} from 'lucide-react';
import { kitchenService } from '@/services/api';
import { toast } from 'sonner';
import type { Order } from '@/types';

const statusColors: Record<string, string> = {
  in_kitchen: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
  cooking: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
  ready: 'bg-green-500/10 text-green-500 border-green-500/20',
};

const statusLabels: Record<string, string> = {
  in_kitchen: 'In Kitchen',
  cooking: 'Cooking',
  ready: 'Ready',
};

function OrderCard({ order, onStartCooking, onMarkReady }: {
  order: Order;
  onStartCooking: (id: number) => void;
  onMarkReady: (id: number) => void;
}) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      if (order.kitchen_started_at) {
        const start = new Date(order.kitchen_started_at).getTime();
        setElapsed(Math.floor((Date.now() - start) / 1000));
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [order.kitchen_started_at]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
    >
      <Card className={`border-l-4 ${
        order.status === 'in_kitchen' ? 'border-l-yellow-500' :
        order.status === 'cooking' ? 'border-l-orange-500' :
        'border-l-green-500'
      }`}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="font-bold text-sm">{order.table_number || 'T'}</span>
              </div>
              <div>
                <CardTitle className="text-lg">Order #{order.order_number}</CardTitle>
                <p className="text-sm text-muted-foreground">
                  {order.order_type === 'dine_in' ? `Table ${order.table_number}` : 'Takeaway'}
                </p>
              </div>
            </div>
            <Badge className={statusColors[order.status]}>
              {statusLabels[order.status]}
            </Badge>
          </div>
          {order.kitchen_started_at && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground mt-2">
              <Timer className="h-4 w-4" />
              <span className={elapsed > 900 ? 'text-red-500 font-medium' : ''}>
                {formatTime(elapsed)}
              </span>
            </div>
          )}
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {order.items?.filter(item => !item.is_voided).map((item) => (
              <div key={item.id} className="flex items-center justify-between py-2 border-b last:border-0">
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium">
                    {item.quantity}
                  </span>
                  <span>{item.menu_item_name}</span>
                </div>
                {item.special_instructions && (
                  <Badge variant="outline" className="text-xs">
                    {item.special_instructions}
                  </Badge>
                )}
              </div>
            ))}
          </div>

          <div className="flex gap-2 mt-4">
            {order.status === 'in_kitchen' && (
              <Button
                className="flex-1"
                onClick={() => onStartCooking(order.id)}
              >
                <Flame className="h-4 w-4 mr-2" />
                Start Cooking
              </Button>
            )}
            {order.status === 'cooking' && (
              <Button
                className="flex-1 bg-green-600 hover:bg-green-700"
                onClick={() => onMarkReady(order.id)}
              >
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Mark Ready
              </Button>
            )}
            {order.status === 'ready' && (
              <Button variant="outline" className="flex-1" disabled>
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Waiting for Pickup
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default function KitchenDisplay() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('all');

  const { data: orders, isLoading } = useQuery({
    queryKey: ['kitchen-orders'],
    queryFn: kitchenService.getOrders,
    refetchInterval: 5000, // Refresh every 5 seconds
  });

  const { data: stats } = useQuery({
    queryKey: ['kitchen-stats'],
    queryFn: kitchenService.getStats,
    refetchInterval: 5000,
  });

  const startCookingMutation = useMutation({
    mutationFn: kitchenService.startCooking,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kitchen-orders'] });
      toast.success('Started cooking!');
    },
  });

  const markReadyMutation = useMutation({
    mutationFn: kitchenService.markReady,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kitchen-orders'] });
      toast.success('Order marked as ready!');
    },
  });

  const filteredOrders = orders?.filter((order) => {
    if (activeTab === 'all') return true;
    return order.status === activeTab;
  });

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-[calc(100vh-4rem)] flex flex-col space-y-4"
    >
      {/* Header */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <ChefHat className="h-8 w-8" />
            Kitchen Display
          </h1>
          <p className="text-muted-foreground mt-1">Manage incoming orders</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4">
          <Card className="px-4 py-2">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-yellow-500" />
              <span className="font-medium">{stats?.pending_orders || 0} Pending</span>
            </div>
          </Card>
          <Card className="px-4 py-2">
            <div className="flex items-center gap-2">
              <Flame className="h-4 w-4 text-orange-500" />
              <span className="font-medium">{stats?.cooking_orders || 0} Cooking</span>
            </div>
          </Card>
          <Card className="px-4 py-2">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <span className="font-medium">{stats?.ready_orders || 0} Ready</span>
            </div>
          </Card>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <TabsList className="grid w-full grid-cols-4 lg:max-w-md">
          <TabsTrigger value="all">
            All ({orders?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="in_kitchen">
            Pending ({orders?.filter(o => o.status === 'in_kitchen').length || 0})
          </TabsTrigger>
          <TabsTrigger value="cooking">
            Cooking ({orders?.filter(o => o.status === 'cooking').length || 0})
          </TabsTrigger>
          <TabsTrigger value="ready">
            Ready ({orders?.filter(o => o.status === 'ready').length || 0})
          </TabsTrigger>
        </TabsList>

        <ScrollArea className="mt-4 h-[65vh]">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-4">
            <AnimatePresence mode="popLayout">
              {isLoading ? (
                <div className="col-span-full text-center py-12">
                  <ChefHat className="h-12 w-12 mx-auto mb-3 animate-bounce" />
                  <p className="text-muted-foreground">Loading orders...</p>
                </div>
              ) : filteredOrders?.length === 0 ? (
                <div className="col-span-full text-center py-12">
                  <AlertCircle className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
                  <p className="text-muted-foreground">No orders in this section</p>
                </div>
              ) : (
                filteredOrders?.map((order) => (
                  <OrderCard
                    key={order.id}
                    order={order}
                    onStartCooking={(id) => startCookingMutation.mutate(id)}
                    onMarkReady={(id) => markReadyMutation.mutate(id)}
                  />
                ))
              )}
            </AnimatePresence>
          </div>
        </ScrollArea>
      </Tabs>
    </motion.div>
  );
}
