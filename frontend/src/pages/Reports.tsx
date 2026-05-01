import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { DatePicker } from '@/components/ui/date-picker';
import {
  BarChart3,
  TrendingUp,
  DollarSign,
  ShoppingCart,
  Package,
  Users,
  Download,
  Calendar,
  Sparkles,
  Brain,
  MessageSquare,
  Loader2,
  AlertTriangle,
  CheckCircle,
} from 'lucide-react';
import { aiService, reportService } from '@/services/api';
import { format, subDays } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export default function Reports() {
  const [date, setDate] = useState<Date>(new Date());
  const [question, setQuestion] = useState('How can I increase today\'s profit?');
  const [salesFrom, setSalesFrom] = useState<Date>(subDays(new Date(), 30));
  const [salesTo, setSalesTo] = useState<Date>(new Date());
  const { hasRole } = useAuth();
  const canUseAI = hasRole(['admin', 'manager']);

  const { data: dailyReport } = useQuery({
    queryKey: ['daily-report', date],
    queryFn: () => reportService.getDailyReport(format(date, 'yyyy-MM-dd')),
  });

  const { data: dashboardSummary } = useQuery({
    queryKey: ['dashboard-summary'],
    queryFn: reportService.getDashboardSummary,
  });

  // Sales report query
  const { data: salesReport, isFetching: loadingSales, refetch: refetchSales } = useQuery({
    queryKey: ['sales-report', format(salesFrom, 'yyyy-MM-dd'), format(salesTo, 'yyyy-MM-dd')],
    queryFn: () => reportService.getSalesReport(format(salesFrom, 'yyyy-MM-dd'), format(salesTo, 'yyyy-MM-dd')),
  });

  // Inventory report query
  const { data: inventoryReport, isFetching: loadingInventory } = useQuery({
    queryKey: ['inventory-report'],
    queryFn: reportService.getInventoryReport,
    staleTime: 60000,
  });

  // Employee report query
  const { data: employeeReport, isFetching: loadingEmployee } = useQuery({
    queryKey: ['employee-report'],
    queryFn: () => reportService.getEmployeeReport(),
    staleTime: 60000,
  });

  // AI queries — disabled on mount, triggered manually
  const { data: businessInsights, refetch: refetchInsights, isFetching: loadingInsights } = useQuery({
    queryKey: ['ai-business-insights'],
    queryFn: aiService.getBusinessInsights,
    enabled: false,
    retry: false,
    staleTime: 300000,
  });

  const { data: demandPrediction, refetch: refetchPrediction, isFetching: loadingPrediction } = useQuery({
    queryKey: ['ai-demand-prediction'],
    queryFn: aiService.getDemandPrediction,
    enabled: false,
    retry: false,
    staleTime: 300000,
  });

  const { data: menuOptimization, refetch: refetchOptimization, isFetching: loadingOptimization } = useQuery({
    queryKey: ['ai-menu-optimization'],
    queryFn: aiService.getMenuOptimization,
    enabled: false,
    retry: false,
    staleTime: 300000,
  });

  const chatMutation = useMutation({
    mutationFn: aiService.chatAssistant,
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to ask AI assistant');
    },
  });

  const handleAskAI = () => {
    if (!question.trim()) {
      toast.error('Please type a question for the assistant');
      return;
    }
    chatMutation.mutate(question.trim());
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Reports & Analytics</h1>
          <p className="text-muted-foreground mt-1">View business performance and insights</p>
        </div>
        <Button variant="outline" className="gap-2 w-full sm:w-auto">
          <Download className="h-4 w-4" />
          Export Report
        </Button>
      </div>

      <Tabs defaultValue="daily" className="space-y-6">
        <TabsList className="w-full overflow-x-auto justify-start">
          <TabsTrigger value="daily" className="gap-2">
            <Calendar className="h-4 w-4" />
            Daily
          </TabsTrigger>
          <TabsTrigger value="sales" className="gap-2">
            <TrendingUp className="h-4 w-4" />
            Sales
          </TabsTrigger>
          <TabsTrigger value="inventory" className="gap-2">
            <Package className="h-4 w-4" />
            Inventory
          </TabsTrigger>
          <TabsTrigger value="employees" className="gap-2">
            <Users className="h-4 w-4" />
            Employees
          </TabsTrigger>
          <TabsTrigger value="ai" className="gap-2">
            <Sparkles className="h-4 w-4" />
            AI
          </TabsTrigger>
        </TabsList>

        <TabsContent value="daily" className="space-y-6">
          {/* Date Selector */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                <span className="text-sm font-medium">Select Date:</span>
                <DatePicker date={date} setDate={setDate} />
              </div>
            </CardContent>
          </Card>

          {/* Daily Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <DollarSign className="h-8 w-8 text-green-500" />
                  <div>
                    <p className="text-sm text-muted-foreground">Total Sales</p>
                    <p className="text-2xl font-bold">{dailyReport?.total_sales?.toFixed(2) || '0.00'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <ShoppingCart className="h-8 w-8 text-blue-500" />
                  <div>
                    <p className="text-sm text-muted-foreground">Total Orders</p>
                    <p className="text-2xl font-bold">{dailyReport?.total_orders || 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <TrendingUp className="h-8 w-8 text-purple-500" />
                  <div>
                    <p className="text-sm text-muted-foreground">Net Profit</p>
                    <p className="text-2xl font-bold">{dailyReport?.net_profit?.toFixed(2) || '0.00'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <BarChart3 className="h-8 w-8 text-orange-500" />
                  <div>
                    <p className="text-sm text-muted-foreground">Avg Order Value</p>
                    <p className="text-2xl font-bold">{dailyReport?.average_order_value?.toFixed(2) || '0.00'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Top Selling Items */}
          <Card>
            <CardHeader>
              <CardTitle>Top Selling Items</CardTitle>
            </CardHeader>
            <CardContent>
              {dailyReport?.top_selling_items?.length === 0 ? (
                <p className="text-muted-foreground">No sales data for this date</p>
              ) : (
                <div className="space-y-3">
                  {dailyReport?.top_selling_items?.map((item, index) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center font-bold">
                          {index + 1}
                        </span>
                        <span className="font-medium truncate">{item.name}</span>
                      </div>
                      <div className="flex items-center gap-4 sm:gap-6 shrink-0">
                        <span className="text-sm text-muted-foreground">
                          {item.quantity_sold} sold
                        </span>
                        <span className="font-semibold">
                          {item.revenue.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── SALES TAB ── */}
        <TabsContent value="sales" className="space-y-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
                <span className="text-sm font-medium whitespace-nowrap">From:</span>
                <DatePicker date={salesFrom} setDate={setSalesFrom} />
                <span className="text-sm font-medium whitespace-nowrap">To:</span>
                <DatePicker date={salesTo} setDate={setSalesTo} />
                <Button size="sm" onClick={() => refetchSales()} disabled={loadingSales}>
                  {loadingSales ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Apply'}
                </Button>
              </div>
            </CardContent>
          </Card>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card><CardContent className="p-4 flex items-center gap-3">
              <DollarSign className="h-8 w-8 text-green-500" />
              <div><p className="text-sm text-muted-foreground">Total Sales</p><p className="text-2xl font-bold">${salesReport?.total_sales?.toFixed(2) ?? '0.00'}</p></div>
            </CardContent></Card>
            <Card><CardContent className="p-4 flex items-center gap-3">
              <ShoppingCart className="h-8 w-8 text-blue-500" />
              <div><p className="text-sm text-muted-foreground">Total Orders</p><p className="text-2xl font-bold">{salesReport?.total_orders ?? 0}</p></div>
            </CardContent></Card>
            <Card><CardContent className="p-4 flex items-center gap-3">
              <BarChart3 className="h-8 w-8 text-orange-500" />
              <div><p className="text-sm text-muted-foreground">Avg Order Value</p><p className="text-2xl font-bold">${salesReport?.average_order_value?.toFixed(2) ?? '0.00'}</p></div>
            </CardContent></Card>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader><CardTitle className="text-base">Top Selling Items</CardTitle></CardHeader>
              <CardContent>
                {salesReport?.top_items?.length === 0 && <p className="text-muted-foreground text-sm">No data for this period.</p>}
                <div className="space-y-2">
                  {salesReport?.top_items?.slice(0, 8).map((item: any, i: number) => (
                    <div key={item.id} className="flex justify-between items-center p-2 rounded bg-muted/40">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-primary/10 text-xs flex items-center justify-center font-bold">{i + 1}</span>
                        <span className="text-sm font-medium truncate max-w-[160px]">{item.name}</span>
                      </div>
                      <div className="flex gap-4 text-sm shrink-0">
                        <span className="text-muted-foreground">{item.quantity_sold} sold</span>
                        <span className="font-semibold">${item.revenue?.toFixed(2)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-base">Sales by Category</CardTitle></CardHeader>
              <CardContent>
                {salesReport?.sales_by_category?.length === 0 && <p className="text-muted-foreground text-sm">No data for this period.</p>}
                <div className="space-y-2">
                  {salesReport?.sales_by_category?.map((cat: any) => (
                    <div key={cat.category} className="flex justify-between items-center p-2 rounded bg-muted/40">
                      <span className="text-sm font-medium">{cat.category}</span>
                      <div className="flex gap-4 text-sm">
                        <span className="text-muted-foreground">{cat.quantity} items</span>
                        <span className="font-semibold">${cat.revenue?.toFixed(2)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ── INVENTORY TAB ── */}
        <TabsContent value="inventory" className="space-y-4">
          {loadingInventory && <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div>}
          {inventoryReport && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card><CardContent className="p-4 flex items-center gap-3">
                  <Package className="h-8 w-8 text-blue-500" />
                  <div><p className="text-sm text-muted-foreground">Total Items</p><p className="text-2xl font-bold">{inventoryReport.total_items}</p></div>
                </CardContent></Card>
                <Card><CardContent className="p-4 flex items-center gap-3">
                  <DollarSign className="h-8 w-8 text-green-500" />
                  <div><p className="text-sm text-muted-foreground">Stock Value</p><p className="text-2xl font-bold">${inventoryReport.total_stock_value?.toFixed(2)}</p></div>
                </CardContent></Card>
                <Card><CardContent className="p-4 flex items-center gap-3">
                  <AlertTriangle className="h-8 w-8 text-yellow-500" />
                  <div><p className="text-sm text-muted-foreground">Low Stock</p><p className="text-2xl font-bold">{inventoryReport.low_stock_count}</p></div>
                </CardContent></Card>
                <Card><CardContent className="p-4 flex items-center gap-3">
                  <AlertTriangle className="h-8 w-8 text-red-500" />
                  <div><p className="text-sm text-muted-foreground">Out of Stock</p><p className="text-2xl font-bold">{inventoryReport.out_of_stock_count}</p></div>
                </CardContent></Card>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Card>
                  <CardHeader><CardTitle className="text-base text-yellow-600">Low Stock Items</CardTitle></CardHeader>
                  <CardContent>
                    {inventoryReport.low_stock_items?.length === 0 && <p className="text-muted-foreground text-sm">All items are well stocked.</p>}
                    <div className="space-y-2">
                      {inventoryReport.low_stock_items?.map((item: any) => (
                        <div key={item.id} className="flex justify-between items-center p-2 rounded bg-yellow-50 dark:bg-yellow-900/10">
                          <span className="text-sm font-medium">{item.name}</span>
                          <div className="flex gap-3 text-sm">
                            <Badge variant="outline" className="text-yellow-600">{item.quantity} {item.unit}</Badge>
                            <span className="text-muted-foreground">min: {item.min_stock_level}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader><CardTitle className="text-base text-red-600">Out of Stock</CardTitle></CardHeader>
                  <CardContent>
                    {inventoryReport.out_of_stock_items?.length === 0 && <p className="text-sm text-muted-foreground flex items-center gap-2"><CheckCircle className="h-4 w-4 text-green-500" />No items are out of stock.</p>}
                    <div className="space-y-2">
                      {inventoryReport.out_of_stock_items?.map((item: any) => (
                        <div key={item.id} className="flex justify-between items-center p-2 rounded bg-red-50 dark:bg-red-900/10">
                          <span className="text-sm font-medium">{item.name}</span>
                          <Badge variant="destructive">Out of Stock</Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </TabsContent>

        {/* ── EMPLOYEES TAB ── */}
        <TabsContent value="employees" className="space-y-4">
          {loadingEmployee && <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div>}
          {employeeReport && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card><CardContent className="p-4 flex items-center gap-3">
                  <Users className="h-8 w-8 text-blue-500" />
                  <div><p className="text-sm text-muted-foreground">Total Employees</p><p className="text-2xl font-bold">{employeeReport.total_employees}</p></div>
                </CardContent></Card>
                <Card><CardContent className="p-4 flex items-center gap-3">
                  <CheckCircle className="h-8 w-8 text-green-500" />
                  <div><p className="text-sm text-muted-foreground">Active Employees</p><p className="text-2xl font-bold">{employeeReport.active_employees}</p></div>
                </CardContent></Card>
                <Card><CardContent className="p-4 flex items-center gap-3">
                  <DollarSign className="h-8 w-8 text-purple-500" />
                  <div><p className="text-sm text-muted-foreground">Total Net Salary</p><p className="text-2xl font-bold">${employeeReport.salary_summary?.total_net?.toFixed(2) ?? '0.00'}</p></div>
                </CardContent></Card>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Card>
                  <CardHeader><CardTitle className="text-base">Attendance Summary ({employeeReport.month}/{employeeReport.year})</CardTitle></CardHeader>
                  <CardContent>
                    {Object.keys(employeeReport.attendance_summary ?? {}).length === 0 && <p className="text-muted-foreground text-sm">No attendance records this month.</p>}
                    <div className="space-y-2">
                      {Object.entries(employeeReport.attendance_summary ?? {}).map(([status, count]: [string, any]) => (
                        <div key={status} className="flex justify-between items-center p-2 rounded bg-muted/40">
                          <span className="text-sm font-medium capitalize">{status}</span>
                          <Badge variant="secondary">{count} records</Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader><CardTitle className="text-base">Salary Summary</CardTitle></CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between p-2 rounded bg-muted/40">
                      <span className="text-sm">Total Earnings</span>
                      <span className="font-semibold text-green-600">${employeeReport.salary_summary?.total_earnings?.toFixed(2) ?? '0.00'}</span>
                    </div>
                    <div className="flex justify-between p-2 rounded bg-muted/40">
                      <span className="text-sm">Total Deductions</span>
                      <span className="font-semibold text-red-500">${employeeReport.salary_summary?.total_deductions?.toFixed(2) ?? '0.00'}</span>
                    </div>
                    <div className="flex justify-between p-2 rounded bg-primary/10">
                      <span className="text-sm font-medium">Net Payable</span>
                      <span className="font-bold">${employeeReport.salary_summary?.total_net?.toFixed(2) ?? '0.00'}</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </TabsContent>

        <TabsContent value="ai" className="space-y-4">
          {!canUseAI ? (
            <Card>
              <CardContent className="p-6 text-center text-muted-foreground">
                <Sparkles className="h-10 w-10 mx-auto mb-3 opacity-60" />
                <p>AI reports are available for manager and admin roles.</p>
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <Card className="lg:col-span-2">
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Brain className="h-5 w-5" />
                      Business Insights
                    </CardTitle>
                    <Button variant="outline" size="sm" onClick={() => refetchInsights()} disabled={loadingInsights}>
                      {loadingInsights ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Refresh'}
                    </Button>
                  </CardHeader>
                  <CardContent>
                    <p className="whitespace-pre-wrap text-sm text-muted-foreground">
                      {businessInsights?.insights || 'No insights yet. Refresh to generate AI analysis.'}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Quick AI Status</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Sales Today</span>
                      <Badge variant="secondary">{dashboardSummary?.today_sales?.toFixed(2) || '0.00'}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Orders Today</span>
                      <Badge variant="secondary">{dashboardSummary?.today_orders || 0}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Low Stock</span>
                      <Badge variant="secondary">{dashboardSummary?.low_stock_count || 0}</Badge>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="text-base">Demand Prediction</CardTitle>
                    <Button variant="outline" size="sm" onClick={() => refetchPrediction()} disabled={loadingPrediction}>
                      {loadingPrediction ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Refresh'}
                    </Button>
                  </CardHeader>
                  <CardContent>
                    <p className="whitespace-pre-wrap text-sm text-muted-foreground">
                      {demandPrediction?.prediction || 'No prediction generated yet.'}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="text-base">Menu Optimization</CardTitle>
                    <Button variant="outline" size="sm" onClick={() => refetchOptimization()} disabled={loadingOptimization}>
                      {loadingOptimization ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Refresh'}
                    </Button>
                  </CardHeader>
                  <CardContent>
                    <p className="whitespace-pre-wrap text-sm text-muted-foreground">
                      {menuOptimization?.suggestions || 'No menu optimization suggestions yet.'}
                    </p>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5" />
                    Ask AI Assistant
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Textarea value={question} onChange={(e) => setQuestion(e.target.value)} className="min-h-24" />
                  <Button onClick={handleAskAI} disabled={chatMutation.isPending}>
                    {chatMutation.isPending ? (
                      <span className="inline-flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" />Thinking...</span>
                    ) : (
                      'Ask Assistant'
                    )}
                  </Button>
                  {chatMutation.data?.answer && (
                    <div className="rounded-lg border p-4 bg-muted/30">
                      <p className="text-sm whitespace-pre-wrap">{chatMutation.data.answer}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}
