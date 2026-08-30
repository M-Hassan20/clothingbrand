import { useState, useEffect, useCallback, useRef } from 'react';
import { api } from '../api/client';
import { getErrorMessage } from '../utils/error';
import { toast } from 'sonner';
import { Link, useNavigate } from 'react-router-dom';
import {
  TrendingUp,
  ShoppingBag,
  AlertCircle,
  Activity,
  Loader2,
  ArrowRight,
  ClipboardList,
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';

interface Order {
  id: number;
  userId: number;
  userEmail: string;
  userFullName: string;
  status: string;
  totalAmount: number;
  createdAt: string;
}

interface Product {
  id: number;
  name: string;
}

interface ProductVariantResponse {
  id: number;
  stockQuantity: number;
}

type ChartRange = 7 | 15 | 30;

function buildChartData(orders: Order[], days: ChartRange) {
  const trendData = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const label = d.toLocaleDateString(undefined, { month: 'short', day: '2-digit' });
    const isoString = d.toISOString().split('T')[0];

    const dayOrders = orders.filter((o) => o.createdAt.startsWith(isoString));
    const dayRevenue = dayOrders.reduce((sum, o) => sum + o.totalAmount, 0);
    trendData.push({ date: label, revenue: dayRevenue });
  }
  return trendData;
}

const RANGE_OPTIONS: { label: string; value: ChartRange }[] = [
  { label: '7 D', value: 7 },
  { label: '15 D', value: 15 },
  { label: '30 D', value: 30 },
];

export default function Dashboard() {
  const navigate = useNavigate();

  // Metrics States
  const [loading, setLoading] = useState(true);
  const [pendingOrdersCount, setPendingOrdersCount] = useState(0);
  const [todayRevenue, setTodayRevenue] = useState(0);
  const [lowStockCount, setLowStockCount] = useState(0);
  const [totalProductsCount, setTotalProductsCount] = useState(0);
  
  // Lists
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [chartData, setChartData] = useState<Array<{ date: string; revenue: number }>>([]);
  const [chartRange, setChartRange] = useState<ChartRange>(30);
  const allOrdersRef = useRef<Order[]>([]);

  const handleRangeChange = useCallback((range: ChartRange) => {
    setChartRange(range);
    setChartData(buildChartData(allOrdersRef.current, range));
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // 1. Fetch Order Status Counts (for Pending Orders)
      const statusCounts = await api.get<Record<string, number>>('/admin/orders/analytics/status-counts');
      const pending = (statusCounts?.['PENDING'] || 0) + (statusCounts?.['PROCESSING'] || 0);
      setPendingOrdersCount(pending);

      // 2. Fetch Today's Revenue
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const todayEnd = new Date();
      todayEnd.setHours(23, 59, 59, 999);
      
      const todayRevData = await api.get<{ totalRevenue?: number }>(
        `/admin/orders/analytics/revenue?startDate=${todayStart.toISOString().slice(0, 19)}&endDate=${todayEnd.toISOString().slice(0, 19)}`
      );
      setTodayRevenue(todayRevData?.totalRevenue || 0);

      // 3. Fetch Low Stock Items
      const lowStockVariants = await api.get<ProductVariantResponse[]>(
        '/admin/products/variants/low-stock?threshold=10'
      );
      setLowStockCount(lowStockVariants?.length || 0);

      // 4. Fetch Total Products
      const productsRes = await api.get<{ content?: Product[] } | Product[]>('/admin/products?size=1000');
      const productsList = Array.isArray(productsRes) 
        ? productsRes 
        : (productsRes?.content || []);
      setTotalProductsCount(productsList.length);

      // 5. Fetch Orders for Recent Table and Chart aggregation
      const ordersRes = await api.get<{ content?: Order[] } | Order[]>('/admin/orders?size=100');
      const ordersList = Array.isArray(ordersRes) 
        ? ordersRes 
        : (ordersRes?.content || []);
      
      // Sorted by date descending
      const sortedOrders = [...ordersList].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      setRecentOrders(sortedOrders.slice(0, 5));

      // 6. Store orders and generate chart data based on current range
      allOrdersRef.current = ordersList;
      setChartData(buildChartData(ordersList, chartRange));

    } catch (err) {
      console.error('Failed to load dashboard data:', err);
      toast.error(getErrorMessage(err, 'Failed to load dashboard metrics'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-warning/10 text-warning border border-warning/20">Awaiting Confirmation</span>;
      case 'PROCESSING':
        return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-warning/10 text-warning border border-warning/20">Preparing Order</span>;
      case 'PAID':
      case 'CONFIRMED':
      case 'SHIPPED':
        return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-accent/10 text-accent border border-accent/20">Confirmed / Sent</span>;
      case 'DELIVERED':
        return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-success/10 text-success border border-success/20">Delivered</span>;
      case 'CANCELLED':
        return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-error/10 text-error border border-error/20">Cancelled</span>;
      default:
        return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-draft/10 text-draft border border-draft/20">{status}</span>;
    }
  };

  if (loading && chartData.length === 0) {
    return (
      <div className="flex justify-center items-center py-32">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
        <span className="text-xs text-text-secondary ml-2 font-sans font-medium">Assembling store metrics...</span>
      </div>
    );
  }

  const chartRangeLabel = chartRange === 7 ? 'Last 7 Days' : chartRange === 15 ? 'Last 15 Days' : 'Last 30 Days';

  return (
    <div className="space-y-6 font-sans">
      {/* Low Stock Alert Banner */}
      {lowStockCount > 0 && (
        <div data-testid="dashboard-low-stock-banner" className="bg-error/10 border border-error/20 text-error px-4 py-3 rounded-md flex items-center justify-between text-xs font-medium">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4.5 w-4.5 text-error shrink-0" />
            <span>
              Alert: There are <strong>{lowStockCount}</strong> product variants currently running below stock threshold.
            </span>
          </div>
          <button
            onClick={() => navigate('/inventory')}
            className="flex items-center gap-1 hover:underline font-semibold shrink-0 cursor-pointer"
          >
            Review Inventory
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Stat Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Card 1: Pending Orders */}
        <div data-testid="dashboard-pending-orders" className="bg-surface border border-border p-5 rounded-md flex items-center justify-between shadow-sm">
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold text-text-secondary uppercase tracking-wider block">
              Pending Orders
            </span>
            <span className="font-serif text-3xl font-bold text-text-primary block">
              {pendingOrdersCount}
            </span>
            <span className="text-[10px] text-text-secondary block">
              Requires fulfillment
            </span>
          </div>
          <div className="h-11 w-11 rounded-full flex items-center justify-center text-warning bg-warning/10 shrink-0">
            <ShoppingBag className="h-5 w-5" />
          </div>
        </div>

        {/* Card 2: Today's Revenue */}
        <div data-testid="dashboard-today-revenue" className="bg-surface border border-border p-5 rounded-md flex items-center justify-between shadow-sm">
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold text-text-secondary uppercase tracking-wider block">
              Today's Revenue
            </span>
            <span className="font-serif text-3xl font-bold text-text-primary block">
              ${todayRevenue.toFixed(2)}
            </span>
            <span className="text-[10px] text-text-secondary block">
              Cleared checkouts
            </span>
          </div>
          <div className="h-11 w-11 rounded-full flex items-center justify-center text-accent bg-accent/15 shrink-0">
            <TrendingUp className="h-5 w-5" />
          </div>
        </div>

        {/* Card 3: Low Stock Items */}
        <div data-testid="dashboard-low-stock-count" className="bg-surface border border-border p-5 rounded-md flex items-center justify-between shadow-sm">
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold text-text-secondary uppercase tracking-wider block">
              Low Stock Items
            </span>
            <span className="font-serif text-3xl font-bold text-text-primary block">
              {lowStockCount}
            </span>
            <span className="text-[10px] text-text-secondary block">
              Below threshold
            </span>
          </div>
          <div className="h-11 w-11 rounded-full flex items-center justify-center text-error bg-error/10 shrink-0">
            <AlertCircle className="h-5 w-5" />
          </div>
        </div>

        {/* Card 4: Total Products */}
        <div data-testid="dashboard-total-products" className="bg-surface border border-border p-5 rounded-md flex items-center justify-between shadow-sm">
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold text-text-secondary uppercase tracking-wider block">
              Total Products
            </span>
            <span className="font-serif text-3xl font-bold text-text-primary block">
              {totalProductsCount}
            </span>
            <span className="text-[10px] text-text-secondary block">
              Active catalog items
            </span>
          </div>
          <div className="h-11 w-11 rounded-full flex items-center justify-center text-success bg-success/10 shrink-0">
            <Activity className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* Main Grid: Revenue Chart & Recent Orders */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Revenue Trend Chart */}
        <div className="lg:col-span-8 bg-surface border border-border p-6 rounded-md shadow-sm space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="font-serif text-sm font-bold text-text-primary tracking-wide">
                Revenue Trend ({chartRangeLabel})
              </h3>
              <p className="text-[10px] text-text-secondary">
                Daily checkout sales totals.
              </p>
            </div>
            <div className="flex items-center gap-1 bg-background border border-border rounded-md p-0.5 shrink-0">
              {RANGE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => handleRangeChange(opt.value)}
                  className={`px-2.5 py-1 rounded text-[10px] font-semibold transition-all cursor-pointer ${
                    chartRange === opt.value
                      ? 'bg-accent text-white shadow-sm'
                      : 'text-text-secondary hover:text-text-primary hover:bg-surface'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
          
          <div className="h-72 w-full text-xs">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5DED4" />
                <XAxis dataKey="date" tickLine={false} axisLine={false} stroke="#8A7B7C" />
                <YAxis tickLine={false} axisLine={false} stroke="#8A7B7C" tickFormatter={(v) => `$${v}`} />
                <Tooltip
                  formatter={(value) => [`$${value}`, 'Revenue']}
                  contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#E5DED4', borderRadius: '4px' }}
                />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="#B08968"
                  strokeWidth={2.5}
                  dot={{ r: 3, stroke: '#B08968', strokeWidth: 2, fill: '#FFFFFF' }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Orders List */}
        <div className="lg:col-span-4 bg-surface border border-border p-6 rounded-md shadow-sm flex flex-col justify-between space-y-4">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-serif text-sm font-bold text-text-primary tracking-wide">
                Recent Orders
              </h3>
              <Link to="/orders" className="text-[10px] font-bold text-accent uppercase tracking-wider hover:underline flex items-center gap-0.5">
                View All
                <ArrowRight className="h-3 w-3" />
              </Link>
            </div>

            {recentOrders.length === 0 ? (
              <div className="py-12 text-center text-xs text-text-secondary flex flex-col items-center justify-center gap-2">
                <ClipboardList className="h-6 w-6 text-text-secondary/40" />
                <span>No checkout transactions found.</span>
              </div>
            ) : (
              <div className="divide-y divide-border/60">
                {recentOrders.map((order) => (
                  <div key={order.id} className="py-3 flex flex-col gap-1 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-text-primary">Order #{order.id}</span>
                      <span className="font-semibold text-text-primary">${order.totalAmount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center text-[10px] text-text-secondary">
                      <span>{order.userFullName || order.userEmail}</span>
                      <span>
                        {new Date(order.createdAt).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                    </div>
                    <div className="mt-1">{getStatusBadge(order.status)}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
