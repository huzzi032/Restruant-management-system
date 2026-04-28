import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  ChefHat,
  Clock,
  CheckCircle2,
  Flame,
  AlertCircle,
  Timer,
  HandPlatter,
} from 'lucide-react';
import { kitchenService } from '@/services/api';
import { toast } from 'sonner';
import type { Order } from '@/types';

/**
 * Simplified one-button flow:
 *   in_kitchen → "🔥 Start Cooking"  (1 click)
 *   cooking    → "✅ Done"           (1 click)
 *   ready      → "🍽 Picked Up"      (1 click)
 */

const statusConfig: Record<string, {
  border: string;
  badge: string;
  label: string;
}> = {
  in_kitchen: {
    border: 'border-l-yellow-500',
    badge: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
    label: 'Waiting',
  },
  cooking: {
    border: 'border-l-orange-500',
    badge: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
    label: 'Cooking',
  },
  ready: {
    border: 'border-l-green-500',
    badge: 'bg-green-500/10 text-green-500 border-green-500/20',
    label: 'Ready',
  },
};

function OrderCard({
  order,
  onAction,
  isActionPending,
}: {
  order: Order;
  onAction: (id: number) => void;
  isActionPending: boolean;
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

  const config = statusConfig[order.status] || statusConfig.in_kitchen;

  // Single button config based on current status
  const buttonLookup: Record<string, { label: string; className: string }> = {
    in_kitchen: {
      label: '🔥 Start Cooking',
      className: 'bg-orange-500 hover:bg-orange-600 text-white shadow-lg shadow-orange-500/20',
    },
    cooking: {
      label: '✅ Done — Mark Ready',
      className: 'bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-600/20',
    },
    ready: {
      label: '🍽️ Picked Up',
      className: 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/20',
    },
  };
  const buttonConfig = buttonLookup[order.status] || { label: 'Next', className: '' };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.92 }}
      transition={{ duration: 0.25 }}
    >
      <Card className={`border-l-4 ${config.border} transition-shadow hover:shadow-md`}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="font-bold text-sm">{order.table_number || 'T'}</span>
              </div>
              <div>
                <CardTitle className="text-lg">Order #{order.order_number}</CardTitle>
                <p className="text-sm text-muted-foreground">
                  {order.order_type === 'dine_in' ? `Table ${order.table_number}` : order.order_type === 'takeaway' ? 'Takeaway' : 'Delivery'}
                  {order.customer_name && ` · ${order.customer_name}`}
                </p>
              </div>
            </div>
            <Badge className={config.badge}>
              {config.label}
            </Badge>
          </div>
          {order.kitchen_started_at && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground mt-2">
              <Timer className="h-4 w-4" />
              <span className={elapsed > 900 ? 'text-red-500 font-semibold animate-pulse' : elapsed > 600 ? 'text-amber-500 font-medium' : ''}>
                {formatTime(elapsed)}
              </span>
              {elapsed > 900 && <span className="text-[10px] text-red-400">⚠ Over 15 min</span>}
            </div>
          )}
        </CardHeader>
        <CardContent>
          {/* Order items */}
          <div className="space-y-1.5 mb-4">
            {order.items?.filter(item => !item.is_voided).map((item) => (
              <div key={item.id} className="flex items-center justify-between py-1.5 border-b last:border-0 border-dashed">
                <div className="flex items-center gap-3">
                  <span className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center text-sm font-bold">
                    {item.quantity}
                  </span>
                  <span className="font-medium text-sm">{item.menu_item_name}</span>
                </div>
                {item.special_instructions && (
                  <Badge variant="outline" className="text-[10px] max-w-[120px] truncate">
                    {item.special_instructions}
                  </Badge>
                )}
              </div>
            ))}
          </div>

          {/* Special instructions for the whole order */}
          {order.special_instructions && (
            <div className="mb-4 rounded-md bg-amber-500/10 border border-amber-500/20 px-3 py-2 text-xs text-amber-600">
              📝 {order.special_instructions}
            </div>
          )}

          {/* ONE button — the only action */}
          <Button
            className={`w-full h-12 text-base font-semibold transition-all ${buttonConfig.className}`}
            onClick={() => onAction(order.id)}
            disabled={isActionPending}
          >
            {isActionPending ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                Processing…
              </span>
            ) : (
              buttonConfig.label
            )}
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default function KitchenDisplay() {
  const queryClient = useQueryClient();
  const [pendingOrderId, setPendingOrderId] = useState<number | null>(null);

  const { data: orders, isLoading } = useQuery({
    queryKey: ['kitchen-orders'],
    queryFn: kitchenService.getOrders,
    refetchInterval: 5000,
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
      queryClient.invalidateQueries({ queryKey: ['kitchen-stats'] });
      setPendingOrderId(null);
      toast.success('Cooking started!');
    },
    onError: () => setPendingOrderId(null),
  });

  const markReadyMutation = useMutation({
    mutationFn: kitchenService.markReady,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kitchen-orders'] });
      queryClient.invalidateQueries({ queryKey: ['kitchen-stats'] });
      setPendingOrderId(null);
      toast.success('Order is ready for pickup!');
    },
    onError: () => setPendingOrderId(null),
  });

  const pickupMutation = useMutation({
    mutationFn: kitchenService.pickupOrder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kitchen-orders'] });
      queryClient.invalidateQueries({ queryKey: ['kitchen-stats'] });
      setPendingOrderId(null);
      toast.success('Order picked up!');
    },
    onError: () => setPendingOrderId(null),
  });

  // Single handler — determines action based on order status
  const handleAction = (orderId: number, status: string) => {
    setPendingOrderId(orderId);
    if (status === 'in_kitchen') {
      startCookingMutation.mutate(orderId);
    } else if (status === 'cooking') {
      markReadyMutation.mutate(orderId);
    } else if (status === 'ready') {
      pickupMutation.mutate(orderId);
    }
  };

  // Group orders by status for clear visual flow
  const waiting = orders?.filter((o) => o.status === 'in_kitchen') || [];
  const cooking = orders?.filter((o) => o.status === 'cooking') || [];
  const ready = orders?.filter((o) => o.status === 'ready') || [];

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
          <p className="text-muted-foreground mt-1">One tap per order — keep it moving</p>
        </div>
        <div className="grid grid-cols-3 gap-2 sm:gap-4">
          <Card className="px-4 py-2">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-yellow-500" />
              <span className="font-medium">{stats?.pending_orders || 0} Waiting</span>
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

      {/* Orders flow — 3 columns on large screens */}
      <ScrollArea className="flex-1">
        {isLoading ? (
          <div className="text-center py-16">
            <ChefHat className="h-12 w-12 mx-auto mb-3 animate-bounce" />
            <p className="text-muted-foreground">Loading orders...</p>
          </div>
        ) : (orders?.length || 0) === 0 ? (
          <div className="text-center py-16">
            <AlertCircle className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
            <p className="text-lg font-medium text-muted-foreground">No active orders</p>
            <p className="text-sm text-muted-foreground/70 mt-1">Orders will appear here when they're sent to the kitchen</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pb-4">
            {/* Column 1: Waiting */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 px-1 pb-2 border-b border-yellow-500/20">
                <Clock className="h-4 w-4 text-yellow-500" />
                <span className="text-sm font-semibold text-yellow-500">Waiting ({waiting.length})</span>
              </div>
              <AnimatePresence mode="popLayout">
                {waiting.map((order) => (
                  <OrderCard
                    key={order.id}
                    order={order}
                    onAction={(id) => handleAction(id, 'in_kitchen')}
                    isActionPending={pendingOrderId === order.id}
                  />
                ))}
              </AnimatePresence>
              {waiting.length === 0 && (
                <p className="text-center py-8 text-sm text-muted-foreground/50">No waiting orders</p>
              )}
            </div>

            {/* Column 2: Cooking */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 px-1 pb-2 border-b border-orange-500/20">
                <Flame className="h-4 w-4 text-orange-500" />
                <span className="text-sm font-semibold text-orange-500">Cooking ({cooking.length})</span>
              </div>
              <AnimatePresence mode="popLayout">
                {cooking.map((order) => (
                  <OrderCard
                    key={order.id}
                    order={order}
                    onAction={(id) => handleAction(id, 'cooking')}
                    isActionPending={pendingOrderId === order.id}
                  />
                ))}
              </AnimatePresence>
              {cooking.length === 0 && (
                <p className="text-center py-8 text-sm text-muted-foreground/50">Nothing cooking yet</p>
              )}
            </div>

            {/* Column 3: Ready */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 px-1 pb-2 border-b border-green-500/20">
                <HandPlatter className="h-4 w-4 text-green-500" />
                <span className="text-sm font-semibold text-green-500">Ready for Pickup ({ready.length})</span>
              </div>
              <AnimatePresence mode="popLayout">
                {ready.map((order) => (
                  <OrderCard
                    key={order.id}
                    order={order}
                    onAction={(id) => handleAction(id, 'ready')}
                    isActionPending={pendingOrderId === order.id}
                  />
                ))}
              </AnimatePresence>
              {ready.length === 0 && (
                <p className="text-center py-8 text-sm text-muted-foreground/50">No orders ready</p>
              )}
            </div>
          </div>
        )}
      </ScrollArea>
    </motion.div>
  );
}
