import { useState } from 'react';
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
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Search,
  CreditCard,
  Banknote,
  Smartphone,
  Wallet,
  Check,
  Clock,
  Printer,
  Receipt,
} from 'lucide-react';
import { orderService, paymentService } from '@/services/api';
import { toast } from 'sonner';
import type { Order } from '@/types';
import { Label } from '@/components/ui/label';

export default function Billing() {
  const [search, setSearch] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<string>('');
  const [tipAmount, setTipAmount] = useState<string>('0');
  const queryClient = useQueryClient();

  const { data: orders, isLoading } = useQuery({
    queryKey: ['billing-orders'],
    queryFn: () => orderService.getOrders(),
    refetchInterval: 5000,
  });

  const paymentMutation = useMutation({
    mutationFn: paymentService.createPayment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ready-orders'] });
      queryClient.invalidateQueries({ queryKey: ['billing-orders'] });
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      setSelectedOrder(null);
      setPaymentMethod('');
      setTipAmount('0');
      toast.success('Payment processed successfully!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Payment failed');
    },
  });

  const filteredOrders = orders?.filter((order) =>
    !['completed', 'cancelled'].includes(order.status) &&
    (
      order.order_number.toLowerCase().includes(search.toLowerCase()) ||
      (order.table_number || '').toLowerCase().includes(search.toLowerCase()) ||
      (order.customer_name || '').toLowerCase().includes(search.toLowerCase())
    )
  );

  const handlePayment = () => {
    if (!selectedOrder || !paymentMethod) return;

    paymentMutation.mutate({
      order_id: selectedOrder.id,
      payment_method: paymentMethod as any,
      tip_amount: parseFloat(tipAmount) || 0,
    });
  };

  const getPaymentIcon = (method: string) => {
    switch (method) {
      case 'cash': return <Banknote className="h-5 w-5" />;
      case 'card': return <CreditCard className="h-5 w-5" />;
      case 'online': return <Smartphone className="h-5 w-5" />;
      case 'wallet': return <Wallet className="h-5 w-5" />;
      default: return <CreditCard className="h-5 w-5" />;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-[calc(100vh-4rem)] grid grid-cols-1 xl:grid-cols-[1fr_24rem] gap-4 md:gap-6"
    >
      {/* Left Panel - Orders */}
      <div className="flex-1 flex flex-col space-y-4">
        <div>
          <h1 className="text-3xl font-bold">Billing</h1>
          <p className="text-muted-foreground mt-1">Process payments for completed orders</p>
        </div>

        <Card>
          <CardContent className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by order number or table..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        <ScrollArea className="h-[50vh] xl:h-[calc(100vh-16rem)]">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-4">
            {isLoading ? (
              <div className="col-span-full text-center py-12">
                <Clock className="h-12 w-12 mx-auto mb-3 animate-spin" />
                <p className="text-muted-foreground">Loading orders...</p>
              </div>
            ) : filteredOrders?.length === 0 ? (
              <div className="col-span-full text-center py-12">
                <Receipt className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
                <p className="text-muted-foreground">No active unpaid orders found</p>
              </div>
            ) : (
              filteredOrders?.map((order) => (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  whileHover={{ scale: 1.02 }}
                >
                  <Card
                    className={`cursor-pointer transition-all ${
                      selectedOrder?.id === order.id ? 'ring-2 ring-primary' : ''
                    }`}
                    onClick={() => setSelectedOrder(order)}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-lg">Order #{order.order_number}</CardTitle>
                          <p className="text-sm text-muted-foreground">
                            {order.order_type === 'dine_in'
                              ? `Table ${order.table_number || 'N/A'}`
                              : `Takeaway Token ${order.order_number}`}
                          </p>
                        </div>
                        <Badge variant={order.status === 'ready' ? 'default' : 'secondary'}>
                          {order.status.replace('_', ' ')}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-1 text-sm">
                        {order.items?.slice(0, 3).map((item) => (
                          <div key={item.id} className="flex justify-between">
                            <span>{item.quantity}x {item.menu_item_name}</span>
                            <span>${item.total_price.toFixed(2)}</span>
                          </div>
                        ))}
                        {order.items && order.items.length > 3 && (
                          <p className="text-muted-foreground text-xs">
                            +{order.items.length - 3} more items
                          </p>
                        )}
                      </div>
                      <Separator className="my-3" />
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Total</span>
                        <span className="text-xl font-bold text-primary">
                          ${order.total_amount.toFixed(2)}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Right Panel - Payment */}
      <Card className="w-full xl:w-96 flex flex-col">
        <CardHeader className="border-b">
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Payment
          </CardTitle>
        </CardHeader>

        <CardContent className="flex-1 p-6 space-y-6">
          {selectedOrder ? (
            <>
              {/* Order Summary */}
              <div className="space-y-3">
                <h3 className="font-semibold">Order Summary</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Order #</span>
                    <span>{selectedOrder.order_number}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>${selectedOrder.subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Tax</span>
                    <span>${selectedOrder.tax_amount.toFixed(2)}</span>
                  </div>
                  {(selectedOrder.discount_amount || 0) > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Discount</span>
                      <span>-${(selectedOrder.discount_amount || 0).toFixed(2)}</span>
                    </div>
                  )}
                </div>
                <Separator />
                <div className="flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span className="text-primary">${selectedOrder.total_amount.toFixed(2)}</span>
                </div>
              </div>

              {/* Tip */}
              <div className="space-y-3">
                <Label>Tip Amount</Label>
                <Input
                  type="number"
                  placeholder="Enter tip amount"
                  value={tipAmount}
                  onChange={(e) => setTipAmount(e.target.value)}
                />
              </div>

              {/* Payment Method */}
              <div className="space-y-3">
                <Label>Payment Method</Label>
                <div className="grid grid-cols-2 gap-2">
                  {['cash', 'card', 'online', 'wallet'].map((method) => (
                    <Button
                      key={method}
                      variant={paymentMethod === method ? 'default' : 'outline'}
                      className="h-16 flex flex-col gap-1"
                      onClick={() => setPaymentMethod(method)}
                    >
                      {getPaymentIcon(method)}
                      <span className="capitalize text-xs">{method}</span>
                    </Button>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-4">
                <Button
                  className="w-full h-12 text-lg font-semibold"
                  disabled={!paymentMethod || paymentMutation.isPending}
                  onClick={handlePayment}
                >
                  {paymentMutation.isPending ? (
                    <>
                      <Clock className="h-5 w-5 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Check className="h-5 w-5 mr-2" />
                      Process Payment
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => setSelectedOrder(null)}
                >
                  Cancel
                </Button>
              </div>
            </>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <CreditCard className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>Select an order to process payment</p>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

