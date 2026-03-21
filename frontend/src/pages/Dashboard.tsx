import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  DollarSign,
  ShoppingCart,
  TrendingUp,
  Users,
  ChefHat,
  Package,
  AlertTriangle,
  Sparkles,
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import { reportService, aiService } from '@/services/api';
import type { AIInsight } from '@/types';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
    },
  },
};

function StatCard({ 
  title, 
  value, 
  icon: Icon, 
  trend,
  trendUp,
  color,
  delay 
}: { 
  title: string; 
  value: string | number; 
  icon: any;
  trend?: string;
  trendUp?: boolean;
  color: string;
  delay: number;
}) {
  return (
    <motion.div
      variants={itemVariants}
      initial="hidden"
      animate="visible"
      transition={{ delay }}
    >
      <Card className="relative overflow-hidden group hover:shadow-lg transition-all duration-300">
        <div className={`absolute top-0 right-0 w-32 h-32 ${color} opacity-10 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-110 transition-transform duration-500`} />
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {title}
          </CardTitle>
          <div className={`p-2 rounded-lg ${color} bg-opacity-10`}>
            <Icon className={`h-4 w-4 ${color.replace('bg-', 'text-')}`} />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{value}</div>
          {trend && (
            <div className={`flex items-center text-xs mt-1 ${trendUp ? 'text-green-500' : 'text-red-500'}`}>
              {trendUp ? <ArrowUpRight className="h-3 w-3 mr-1" /> : <ArrowDownRight className="h-3 w-3 mr-1" />}
              {trend}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

function AIInsightCard({ insight, index }: { insight: AIInsight; index: number }) {
  const icons = {
    positive: TrendingUp,
    warning: AlertTriangle,
    alert: AlertTriangle,
    info: Sparkles,
  };

  const colors = {
    positive: 'bg-green-500/10 text-green-500 border-green-500/20',
    warning: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
    alert: 'bg-red-500/10 text-red-500 border-red-500/20',
    info: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  };

  const Icon = icons[insight.type] || Sparkles;

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.5 + index * 0.1 }}
    >
      <div className={`p-4 rounded-lg border ${colors[insight.type]} flex items-start gap-3`}>
        <Icon className="h-5 w-5 mt-0.5 flex-shrink-0" />
        <div>
          <h4 className="font-semibold text-sm">{insight.title}</h4>
          <p className="text-sm mt-1 opacity-90">{insight.message}</p>
        </div>
      </div>
    </motion.div>
  );
}

export default function Dashboard() {
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const { user, hasRole } = useAuth();
  const canUseAI = hasRole(['admin', 'manager']);

  const { data: summary, isLoading: summaryLoading, refetch: refetchSummary } = useQuery({
    queryKey: ['dashboard-summary'],
    queryFn: reportService.getDashboardSummary,
  });

  const { data: aiInsightsData, isLoading: insightsLoading, refetch: refetchInsights } = useQuery({
    queryKey: ['ai-insights'],
    queryFn: aiService.getDashboardInsights,
    enabled: canUseAI,
  });

  useEffect(() => {
    if (aiInsightsData?.insights) {
      setInsights(aiInsightsData.insights);
    } else if (!canUseAI) {
      setInsights([]);
    }
  }, [aiInsightsData, canUseAI]);

  const handleRefresh = async () => {
    toast.promise(
      Promise.all([refetchSummary(), refetchInsights()]),
      {
        loading: 'Refreshing dashboard...',
        success: 'Dashboard updated!',
        error: 'Failed to refresh',
      }
    );
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Welcome back, {user?.full_name}. Here is today's snapshot.</p>
        </div>
        <Button variant="outline" size="sm" onClick={handleRefresh} className="gap-2 w-full sm:w-auto">
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {summaryLoading ? (
          Array(4).fill(0).map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))
        ) : (
          <>
            <StatCard
              title="Today's Sales"
              value={`$${summary?.today_sales?.toFixed(2) || '0.00'}`}
              icon={DollarSign}
              color="bg-green-500"
              delay={0}
            />
            <StatCard
              title="Today's Orders"
              value={summary?.today_orders || 0}
              icon={ShoppingCart}
              color="bg-blue-500"
              delay={0.1}
            />
            <StatCard
              title="Active Tables"
              value={summary?.active_tables || 0}
              icon={Users}
              color="bg-purple-500"
              delay={0.2}
            />
            <StatCard
              title="Pending Orders"
              value={summary?.pending_orders || 0}
              icon={ChefHat}
              color="bg-orange-500"
              delay={0.3}
            />
          </>
        )}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* AI Insights */}
        <motion.div variants={itemVariants} className="lg:col-span-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                <CardTitle>AI Insights</CardTitle>
              </div>
              <Badge variant="secondary">{canUseAI ? 'Powered by Groq' : 'Manager/Admin only'}</Badge>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[280px] sm:h-[300px]">
                <div className="space-y-3 pr-4">
                  {!canUseAI ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Sparkles className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p>AI panel is available for manager and admin roles.</p>
                    </div>
                  ) : insightsLoading ? (
                    Array(3).fill(0).map((_, i) => (
                      <Skeleton key={i} className="h-20" />
                    ))
                  ) : insights.length > 0 ? (
                    insights.map((insight, index) => (
                      <AIInsightCard key={index} insight={insight} index={index} />
                    ))
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <Sparkles className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p>No insights available yet.</p>
                      <p className="text-sm">Configure GROQ_API_KEY for AI-powered insights.</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </motion.div>

        {/* Quick Actions */}
        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button variant="outline" className="w-full justify-start gap-3" asChild>
                <a href="/orders">
                  <ShoppingCart className="h-4 w-4" />
                  New Order
                </a>
              </Button>
              <Button variant="outline" className="w-full justify-start gap-3" asChild>
                <a href="/billing">
                  <DollarSign className="h-4 w-4" />
                  Process Payment
                </a>
              </Button>
              <Button variant="outline" className="w-full justify-start gap-3" asChild>
                <a href="/inventory">
                  <Package className="h-4 w-4" />
                  Check Inventory
                </a>
              </Button>
              <Button variant="outline" className="w-full justify-start gap-3" asChild>
                <a href="/kitchen">
                  <ChefHat className="h-4 w-4" />
                  Kitchen View
                </a>
              </Button>
            </CardContent>
          </Card>

          {/* Low Stock Alert */}
          {summary && summary.low_stock_count > 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mt-4"
            >
              <Card className="border-red-500/50 bg-red-500/5">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="h-5 w-5 text-red-500" />
                    <div>
                      <p className="font-semibold text-red-500">Low Stock Alert</p>
                      <p className="text-sm text-red-500/80">
                        {summary.low_stock_count} items need restocking
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </motion.div>
      </div>
    </motion.div>
  );
}
