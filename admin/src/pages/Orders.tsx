import { useState, useEffect } from 'react';
import { api } from '../api/client';
import { getErrorMessage } from '../utils/error';
import {
  Search,
  Eye,
  X,
  Loader2,
  Printer,
  Calendar,
  DollarSign,
  MapPin,
  ClipboardList,
  Filter,
  Download,
  Truck,
  PackageCheck,
  FileText,
  ExternalLink,
} from 'lucide-react';
import { toast } from 'sonner';

type OrderStatus = 'PENDING' | 'PROCESSING' | 'CONFIRMED' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';

interface Address {
  id: number;
  label: string;
  street: string;
  city: string;
  country: string;
  zipCode: string;
}

interface OrderItem {
  id: number;
  productName: string;
  size: string;
  color: string;
  quantity: number;
  price: number;
  subtotal: number;
}

interface Order {
  id: number;
  userId: number;
  userEmail: string;
  userFullName: string;
  status: OrderStatus;
  paymentStatus?: 'PENDING' | 'INITIATED' | 'SUCCESS' | 'FAILED' | 'REFUNDED' | 'PARTIALLY_REFUNDED';
  totalAmount: number;
  shippingFee?: number;
  estimatedCourierFee?: number;
  courierMargin?: number;
  shippingAddress?: Address;
  items?: OrderItem[];
  createdAt: string;
  trackingNumber?: string;
  courierName?: string;
  postexStatus?: string;
  pickupAddressCode?: string;
}

interface PaginatedResponse<T> {
  content: T[];
  totalPages: number;
}

export default function Orders() {
  useEffect(() => {
    document.title = 'Orders Ledger | Haus of Hafsah Admin';
  }, []);

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters & Pagination
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // Excel Export States
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [exporting, setExporting] = useState(false);

  // Selected Order details
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [loadingItems, setLoadingItems] = useState(false);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // PostEx Courier States
  const [bookingPostex, setBookingPostex] = useState(false);
  const [trackingModalOpen, setTrackingModalOpen] = useState(false);
  const [trackingDetails, setTrackingDetails] = useState<any>(null);
  const [loadingTracking, setLoadingTracking] = useState(false);

  const handleBookPostEx = async (orderId: number) => {
    try {
      setBookingPostex(true);
      const res = await api.post<Order>(`/admin/postex/book/${orderId}`);
      toast.success('Shipment booked with PostEx successfully!');
      if (res) {
        setSelectedOrder((prev) => (prev ? { ...prev, ...res } : res));
      }
      fetchOrders();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to book shipment with PostEx'));
    } finally {
      setBookingPostex(false);
    }
  };

  const handlePrintAirwayBill = async (trackingNumber: string) => {
    try {
      const token = localStorage.getItem('admin_token');
      const host = typeof window !== 'undefined' && window.location?.hostname ? window.location.hostname : 'localhost';
      const response = await fetch(`http://${host}:8080/api/admin/postex/airway-bill/${trackingNumber}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) {
        throw new Error('Failed to retrieve airway bill PDF');
      }
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      window.open(blobUrl, '_blank');
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to download PostEx Airway Bill PDF'));
    }
  };

  const handleFetchTracking = async (trackingNumber: string) => {
    try {
      setLoadingTracking(true);
      setTrackingModalOpen(true);
      setTrackingDetails(null);
      const res = await api.get<any>(`/admin/postex/track/${trackingNumber}`);
      setTrackingDetails(res);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to fetch PostEx tracking details'));
    } finally {
      setLoadingTracking(false);
    }
  };


  const fetchOrders = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('size', '10');

      // The endpoint returns Page<OrderResponse>
      const response = await api.get<PaginatedResponse<Order> | Order[]>(`/admin/orders?${params.toString()}`);
      
      let list: Order[] = [];
      let total = 0;
      if (response && 'content' in response) {
        list = response.content;
        total = response.totalPages;
      } else {
        list = Array.isArray(response) ? response : [];
      }

      // Client-side filtering because backend gets all orders
      if (statusFilter) {
        list = list.filter(o => o.status === statusFilter);
      }
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        list = list.filter(o =>
          String(o.id).includes(query) ||
          (o.userEmail && o.userEmail.toLowerCase().includes(query)) ||
          (o.userFullName && o.userFullName.toLowerCase().includes(query))
        );
      }

      setOrders(list);
      setTotalPages(total || 1);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to load orders'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, searchQuery, page]);

  const handleOpenOrderDetails = async (order: Order) => {
    setSelectedOrder(order);
    setOrderItems([]);
    
    try {
      setLoadingItems(true);
      // Fetch order items list
      const items = await api.get<OrderItem[]>(`/orders/${order.id}/items`);
      setOrderItems(items || []);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to load order items'));
    } finally {
      setLoadingItems(false);
    }
  };

  const handleUpdateStatus = async (newStatus: OrderStatus) => {
    if (!selectedOrder) return;

    try {
      setUpdatingStatus(true);
      // Calls PATCH /api/admin/orders/{id}/status?status=...
      await api.patch(`/admin/orders/${selectedOrder.id}/status?status=${newStatus}`);
      toast.success(`Order status updated to ${newStatus}`);
      
      // Update local states
      const updatedOrder = { ...selectedOrder, status: newStatus };
      setSelectedOrder(updatedOrder);
      setOrders(prev => prev.map(o => o.id === selectedOrder.id ? updatedOrder : o));
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to update status'));
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handlePrintInvoice = async (orderId: number) => {
    try {
      const token = localStorage.getItem('admin_token');
      const host = typeof window !== 'undefined' && window.location?.hostname ? window.location.hostname : 'localhost';
      // Fetch binary PDF file with authorization credentials
      const response = await fetch(`http://${host}:8080/api/admin/orders/${orderId}/invoice`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) throw new Error('Invoice file not found');
      
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      window.open(blobUrl, '_blank');
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to download invoice PDF'));
    }
  };

  const getStatusStyle = (status: OrderStatus) => {
    switch (status) {
      case 'PENDING':
        return 'bg-warning/15 text-warning border-warning/20';
      case 'PROCESSING':
        return 'bg-indigo-500/15 text-indigo-400 border-indigo-500/20';
      case 'CONFIRMED':
        return 'bg-success/20 text-success border-success/30';
      case 'SHIPPED':
        return 'bg-accent/15 text-accent border-accent/20';
      case 'DELIVERED':
        return 'bg-success/15 text-success border-success/20';
      case 'CANCELLED':
        return 'bg-error/15 text-error border-error/20';
      default:
        return 'bg-text-secondary/15 text-text-secondary border-border';
    }
  };

  const getPaymentStatusStyle = (status?: string) => {
    switch (status?.toUpperCase()) {
      case 'SUCCESS':
        return 'bg-success/20 text-success border-success/30';
      case 'INITIATED':
      case 'PENDING':
        return 'bg-warning/15 text-warning border-warning/20';
      case 'FAILED':
        return 'bg-error/15 text-error border-error/20';
      case 'REFUNDED':
      case 'PARTIALLY_REFUNDED':
        return 'bg-indigo-500/15 text-indigo-400 border-indigo-500/20';
      default:
        return 'bg-text-secondary/15 text-text-secondary border-border';
    }
  };

  const handleExportOrders = async () => {
    try {
      setExporting(true);
      
      const params = new URLSearchParams();
      if (startDate) {
        params.append('startDate', `${startDate}T00:00:00`);
      }
      if (endDate) {
        params.append('endDate', `${endDate}T23:59:59`);
      }

      const queryString = params.toString() ? `?${params.toString()}` : '';
      await api.download(`/admin/excel/export/orders${queryString}`, 'orders_ledger_export.xlsx');
      toast.success('Orders exported successfully!');
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to export orders list'));
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Search and Filters Toolbar */}
      <div className="flex flex-col xl:flex-row gap-4 justify-between items-stretch xl:items-center bg-surface border border-border p-4 rounded-md">
        <div className="flex flex-1 gap-3 max-w-lg items-center">
          <div className="relative flex-1">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-text-secondary">
              <Search className="h-4 w-4" />
            </span>
            <input
              type="text"
              placeholder="Search by Order ID, name, or customer email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-background border border-border pl-9 pr-3 py-1.5 rounded text-xs focus:outline-none focus:ring-1 focus:ring-accent text-text-primary"
            />
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <Filter className="h-3.5 w-3.5 text-text-secondary" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-background border border-border px-3 py-1.5 rounded text-xs focus:outline-none focus:ring-1 focus:ring-accent text-text-primary"
            >
              <option value="">All Statuses</option>
              <option value="PENDING">Pending</option>
              <option value="PROCESSING">Processing</option>
              <option value="PAID">Paid</option>
              <option value="SHIPPED">Shipped</option>
              <option value="DELIVERED">Delivered</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>
        </div>

        {/* Date Filters and Bulk Export */}
        <div className="flex flex-wrap items-center gap-3 bg-background/50 p-2 xl:p-0 rounded xl:bg-transparent text-xs font-sans">
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-text-secondary font-semibold uppercase tracking-wider">From:</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-background border border-border px-2 py-1 rounded text-xs text-text-primary focus:outline-none focus:border-accent"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-text-secondary font-semibold uppercase tracking-wider">To:</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="bg-background border border-border px-2 py-1 rounded text-xs text-text-primary focus:outline-none focus:border-accent"
            />
          </div>
          <button
            onClick={handleExportOrders}
            disabled={exporting}
            className="flex items-center justify-center gap-1.5 bg-accent text-background hover:bg-accent/90 px-3 py-1.5 rounded text-[11px] font-bold uppercase tracking-wider transition-colors disabled:opacity-50 cursor-pointer shadow-xs whitespace-nowrap"
          >
            {exporting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
            <span>Export Orders</span>
          </button>
        </div>
      </div>

      {/* Orders Table */}
      {loading && orders.length === 0 ? (
        <div className="flex justify-center items-center py-20 bg-surface border border-border rounded-md">
          <Loader2 className="h-6 w-6 animate-spin text-accent" />
          <span className="text-xs text-text-secondary ml-2 font-medium">Loading orders ledger...</span>
        </div>
      ) : orders.length === 0 ? (
        <div className="flex flex-col justify-center items-center py-20 bg-surface border border-border rounded-md text-center">
          <ClipboardList className="h-8 w-8 text-text-secondary/50 mb-3" />
          <p className="text-xs font-semibold text-text-primary">No orders found</p>
          <p className="text-[11px] text-text-secondary mt-1">Verify filters or await incoming checkout transactions.</p>
        </div>
      ) : (
        <div className="bg-surface border border-border rounded-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-background border-b border-border text-[10px] uppercase font-semibold tracking-wider text-text-secondary">
                  <th className="py-3 px-6 w-28">Order ID</th>
                  <th className="py-3 px-6">Customer Details</th>
                  <th className="py-3 px-6">Order Date</th>
                  <th className="py-3 px-6">Payment Status</th>
                  <th className="py-3 px-6">Total Amount</th>
                  <th className="py-3 px-6">Order Status</th>
                  <th className="py-3 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {orders.map((order) => (
                  <tr key={order.id} className="hover:bg-background/20 transition-colors">
                    <td className="py-3.5 px-6 font-mono font-semibold text-text-secondary">
                      #{order.id}
                    </td>
                    <td className="py-3.5 px-6">
                      <p className="font-semibold text-text-primary">{order.userFullName || 'Guest Customer'}</p>
                      <p className="text-[10px] text-text-secondary mt-0.5">{order.userEmail}</p>
                    </td>
                    <td className="py-3.5 px-6 text-text-secondary">
                      {order.createdAt ? new Date(order.createdAt).toLocaleDateString(undefined, {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      }) : 'N/A'}
                    </td>
                    <td className="py-3.5 px-6">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full border text-[10px] font-semibold ${getPaymentStatusStyle(
                          order.paymentStatus
                        )}`}
                      >
                        {order.paymentStatus || 'PENDING'}
                      </span>
                    </td>
                    <td className="py-3.5 px-6 font-semibold text-text-primary">
                      Rs. {order.totalAmount.toFixed(2)}
                    </td>
                    <td className="py-3.5 px-6">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full border text-[10px] font-semibold ${getStatusStyle(
                          order.status
                        )}`}
                      >
                        {order.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-6 text-right">
                      <div className="flex justify-end gap-2.5">
                        <button
                          onClick={() => handlePrintInvoice(order.id)}
                          className="p-1 hover:text-accent text-text-secondary transition-colors"
                          title="Print Invoice"
                        >
                          <Printer className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleOpenOrderDetails(order)}
                          className="p-1 hover:text-accent text-text-secondary transition-colors"
                          title="View order details"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-3 border-t border-border bg-background/50">
              <span className="text-[10px] text-text-secondary">
                Page {page + 1} of {totalPages}
              </span>
              <div className="flex gap-2">
                <button
                  disabled={page === 0}
                  onClick={() => setPage(prev => prev - 1)}
                  className="px-2.5 py-1 border border-border rounded text-[10px] font-semibold uppercase hover:bg-surface transition-colors disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  disabled={page === totalPages - 1}
                  onClick={() => setPage(prev => prev + 1)}
                  className="px-2.5 py-1 border border-border rounded text-[10px] font-semibold uppercase hover:bg-surface transition-colors disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Slide-over details Panel */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex justify-end bg-text-primary/45 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-2xl bg-surface h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-250">
            {/* Header */}
            <div className="px-6 py-4 border-b border-border flex justify-between items-center bg-background/50">
              <div>
                <h3 className="font-serif text-base font-semibold text-text-primary">
                  Order Details #{selectedOrder.id}
                </h3>
                <p className="text-[10px] text-text-secondary uppercase tracking-wider mt-0.5 flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  <span>
                    Placed on{' '}
                    {new Date(selectedOrder.createdAt).toLocaleDateString(undefined, {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </p>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="p-1 rounded-full border border-border bg-surface text-text-secondary hover:text-text-primary"
              >
                <X className="h-4.5 w-4.5" />
              </button>
            </div>

            {/* Scrollable details panel */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs text-text-secondary">
              {/* Customer and Delivery Coordinate Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-background/40 border border-border/60 p-4 rounded space-y-2">
                  <h4 className="font-serif font-semibold text-text-primary flex items-center gap-1.5 border-b border-border/40 pb-1.5">
                    <span>Customer Information</span>
                  </h4>
                  <p className="font-semibold text-text-primary">{selectedOrder.userFullName}</p>
                  <p className="text-[11px]">{selectedOrder.userEmail}</p>
                  <p className="text-[11px] uppercase tracking-wider font-semibold text-text-secondary">
                    Payment Method: COD
                  </p>
                </div>

                <div className="bg-background/40 border border-border/60 p-4 rounded space-y-2">
                  <h4 className="font-serif font-semibold text-text-primary flex items-center gap-1.5 border-b border-border/40 pb-1.5">
                    <MapPin className="h-3.5 w-3.5 text-accent" />
                    <span>Shipping Address</span>
                  </h4>
                  {selectedOrder.shippingAddress ? (
                    <>
                      <p className="text-text-primary font-semibold">{selectedOrder.shippingAddress.label || 'Home Address'}</p>
                      <p className="text-[11px] leading-relaxed">{selectedOrder.shippingAddress.street}</p>
                      <p className="text-[11px]">
                        {selectedOrder.shippingAddress.city}, {selectedOrder.shippingAddress.zipCode}
                      </p>
                      <p className="text-[11px]">{selectedOrder.shippingAddress.country}</p>
                    </>
                  ) : (
                    <p className="text-[11px] italic">No shipping address provided</p>
                  )}
                </div>
              </div>

              {/* PostEx Shipping Logistics Panel */}
              <div className="bg-surface border border-accent/20 p-4 rounded-md space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Truck className="h-4 w-4 text-accent" />
                    <span className="font-serif font-semibold text-text-primary text-xs uppercase tracking-wider">
                      PostEx Courier Logistics
                    </span>
                  </div>
                  {selectedOrder.trackingNumber ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-mono font-bold">
                      <PackageCheck className="h-3 w-3" />
                      Tracking #{selectedOrder.trackingNumber}
                    </span>
                  ) : (
                    <span className="text-[10px] text-text-secondary italic">No Shipment Booked</span>
                  )}
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-border/40 text-xs">
                  {selectedOrder.trackingNumber ? (
                    <div className="flex items-center gap-3">
                      <div>
                        <span className="text-[10px] text-text-secondary block">PostEx Status</span>
                        <span className="font-semibold text-text-primary uppercase">{selectedOrder.postexStatus || 'Booked'}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-text-secondary block">Pickup Code</span>
                        <span className="font-mono text-text-primary font-semibold">{selectedOrder.pickupAddressCode || '001'}</span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-[11px] text-text-secondary">
                      Pickup Address Code: <strong className="font-mono text-text-primary">001 (Karachi Warehouse)</strong>
                    </p>
                  )}

                  <div className="flex flex-wrap items-center gap-2">
                    {!selectedOrder.trackingNumber ? (
                      <button
                        disabled={bookingPostex}
                        onClick={() => handleBookPostEx(selectedOrder.id)}
                        className="flex items-center gap-1.5 bg-accent hover:bg-accent/90 text-white px-3.5 py-1.5 rounded text-xs font-semibold uppercase transition-colors disabled:opacity-50"
                      >
                        {bookingPostex ? (
                          <>
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            <span>Booking...</span>
                          </>
                        ) : (
                          <>
                            <Truck className="h-3.5 w-3.5" />
                            <span>Book with PostEx</span>
                          </>
                        )}
                      </button>
                    ) : (
                      <>
                        <button
                          onClick={() => handlePrintAirwayBill(selectedOrder.trackingNumber!)}
                          className="flex items-center gap-1.5 border border-border bg-background hover:bg-surface text-text-primary px-3 py-1 rounded text-xs font-semibold uppercase transition-colors"
                        >
                          <FileText className="h-3.5 w-3.5 text-accent" />
                          <span>Print Airway Bill (PDF)</span>
                        </button>
                        <button
                          onClick={() => handleFetchTracking(selectedOrder.trackingNumber!)}
                          className="flex items-center gap-1.5 border border-accent/40 bg-accent/10 hover:bg-accent/20 text-accent px-3 py-1 rounded text-xs font-semibold uppercase transition-colors"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                          <span>Live Tracking</span>
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Internal Courier Cost & Margin Estimation */}
                <div className="mt-3 pt-2.5 border-t border-border/40 grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                  <div className="bg-background/60 p-2.5 rounded border border-border/40 space-y-0.5">
                    <span className="text-text-secondary block text-[10px] uppercase font-semibold">Customer Shipping</span>
                    <span className="font-semibold text-text-primary font-mono">
                      {selectedOrder.shippingFee && selectedOrder.shippingFee > 0 ? `Rs. ${selectedOrder.shippingFee}` : 'Free'}
                    </span>
                  </div>
                  <div className="bg-background/60 p-2.5 rounded border border-border/40 space-y-0.5">
                    <span className="text-text-secondary block text-[10px] uppercase font-semibold">Est. PostEx Cost</span>
                    <span className="font-semibold text-amber-600 dark:text-amber-400 font-mono">
                      Rs. {selectedOrder.estimatedCourierFee ?? 300}
                    </span>
                  </div>
                  <div className="bg-background/60 p-2.5 rounded border border-border/40 space-y-0.5">
                    <span className="text-text-secondary block text-[10px] uppercase font-semibold">Net Logistics Profit</span>
                    <span className={`font-semibold font-mono ${(selectedOrder.courierMargin ?? 0) >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500'}`}>
                      Rs. {selectedOrder.courierMargin ?? 0}
                    </span>
                  </div>
                </div>
              </div>

              {/* Order Status Action Panel */}
              <div className="bg-surface border border-border p-4 rounded-md flex flex-col sm:flex-row gap-4 items-stretch sm:items-center justify-between">
                <div className="space-y-1">
                  <span className="block font-semibold uppercase text-text-secondary">Status Flow Control</span>
                  <div className="flex items-center gap-2 mt-1">
                    <span
                      className={`inline-flex px-2.5 py-0.5 rounded-full border text-[10px] font-semibold ${getStatusStyle(
                        selectedOrder.status
                      )}`}
                    >
                      ORDER: {selectedOrder.status}
                    </span>
                    <span
                      className={`inline-flex px-2.5 py-0.5 rounded-full border text-[10px] font-semibold ${getPaymentStatusStyle(
                        selectedOrder.paymentStatus
                      )}`}
                    >
                      PAYMENT: {selectedOrder.paymentStatus || 'PENDING'}
                    </span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <select
                    disabled={updatingStatus}
                    value={selectedOrder.status}
                    onChange={(e) => handleUpdateStatus(e.target.value as OrderStatus)}
                    className="bg-background border border-border px-3 py-1.5 rounded text-xs focus:outline-none focus:ring-1 focus:ring-accent text-text-primary font-semibold disabled:opacity-50"
                  >
                    <option value="PENDING">Pending</option>
                    <option value="PROCESSING">Processing</option>
                    <option value="CONFIRMED">Confirmed</option>
                    <option value="SHIPPED">Shipped</option>
                    <option value="DELIVERED">Delivered</option>
                    <option value="CANCELLED">Cancelled</option>
                  </select>
                  <button
                    onClick={() => handlePrintInvoice(selectedOrder.id)}
                    className="flex items-center gap-1.5 border border-border bg-background hover:bg-surface text-text-primary px-3.5 py-1.5 rounded text-xs font-semibold uppercase transition-colors"
                  >
                    <Printer className="h-4 w-4" />
                    <span>Invoice</span>
                  </button>
                </div>
              </div>

              {/* Ordered Items List */}
              <div className="space-y-3">
                <h4 className="font-serif font-semibold text-text-primary border-b border-border/60 pb-1.5">
                  Ordered Items
                </h4>

                {loadingItems ? (
                  <div className="flex justify-center items-center py-8">
                    <Loader2 className="h-5 w-5 animate-spin text-accent" />
                    <span className="text-[11px] text-text-secondary ml-1.5">Loading items...</span>
                  </div>
                ) : orderItems.length === 0 ? (
                  <p className="text-[11px] italic">No items associated with this order.</p>
                ) : (
                  <div className="border border-border/80 rounded overflow-hidden bg-background/25">
                    <table className="w-full text-left border-collapse text-[11px]">
                      <thead>
                        <tr className="bg-background/80 border-b border-border text-[9px] uppercase font-semibold text-text-secondary">
                          <th className="py-2.5 px-4">Item Details</th>
                          <th className="py-2.5 px-4 w-20 text-center">Qty</th>
                          <th className="py-2.5 px-4 w-24 text-right">Price</th>
                          <th className="py-2.5 px-4 w-24 text-right">Subtotal</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/40">
                        {orderItems.map((item) => (
                          <tr key={item.id}>
                            <td className="py-3 px-4">
                              <p className="font-semibold text-text-primary">{item.productName}</p>
                              <p className="text-[10px] text-text-secondary mt-0.5">
                                Variant: {item.color} / Size: {item.size}
                              </p>
                            </td>
                            <td className="py-3 px-4 text-center text-text-primary font-medium">
                              {item.quantity}
                            </td>
                            <td className="py-3 px-4 text-right text-text-secondary">
                              Rs. {item.price.toFixed(2)}
                            </td>
                            <td className="py-3 px-4 text-right font-semibold text-text-primary">
                              Rs. {item.subtotal.toFixed(2)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="bg-background/40 border-t border-border font-semibold text-text-primary">
                          <td colSpan={3} className="py-2.5 px-4 text-right uppercase tracking-wider text-[10px] text-text-secondary">
                            Grand Total:
                          </td>
                          <td className="py-2.5 px-4 text-right text-xs font-bold text-accent">
                            <span>Rs. {selectedOrder.totalAmount.toFixed(2)}</span>
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                )}
              </div>
            </div>

            {/* Footer actions */}
            <div className="px-6 py-4 border-t border-border flex items-center justify-end bg-background/50 gap-3">
              <button
                onClick={() => setSelectedOrder(null)}
                className="px-4 py-2 border border-border rounded text-xs font-semibold uppercase hover:bg-surface transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PostEx Live Tracking Details Modal */}
      {trackingModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-surface border border-border rounded-lg max-w-lg w-full p-6 space-y-4 shadow-2xl relative">
            <button
              onClick={() => setTrackingModalOpen(false)}
              className="absolute top-4 right-4 text-text-secondary hover:text-text-primary"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-2 border-b border-border pb-3">
              <Truck className="h-5 w-5 text-accent" />
              <div>
                <h3 className="font-serif font-bold text-text-primary">PostEx Live Shipment Tracking</h3>
                <p className="text-[11px] text-text-secondary font-mono">
                  {trackingDetails?.dist?.trackingNumber || 'Fetching...'}
                </p>
              </div>
            </div>

            {loadingTracking ? (
              <div className="flex flex-col items-center justify-center py-10 space-y-2">
                <Loader2 className="h-8 w-8 animate-spin text-accent" />
                <p className="text-xs text-text-secondary">Retrieving latest status from PostEx API...</p>
              </div>
            ) : trackingDetails?.dist ? (
              <div className="space-y-4 text-xs">
                <div className="bg-background border border-border p-3 rounded grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-[10px] text-text-secondary uppercase">Current Status</span>
                    <p className="font-bold text-accent uppercase text-sm mt-0.5">
                      {trackingDetails.dist.transactionStatus || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <span className="text-[10px] text-text-secondary uppercase">Status Code</span>
                    <p className="font-mono font-semibold text-text-primary mt-0.5">
                      {trackingDetails.dist.transactionStatusId || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <span className="text-[10px] text-text-secondary uppercase">Recipient</span>
                    <p className="font-medium text-text-primary mt-0.5">
                      {trackingDetails.dist.customerName || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <span className="text-[10px] text-text-secondary uppercase">City</span>
                    <p className="font-medium text-text-primary mt-0.5">
                      {trackingDetails.dist.cityName || 'N/A'}
                    </p>
                  </div>
                </div>

                {trackingDetails.dist.trackingHistory && trackingDetails.dist.trackingHistory.length > 0 ? (
                  <div className="space-y-2">
                    <h4 className="font-semibold text-text-primary border-b border-border/40 pb-1 text-[11px] uppercase">
                      Tracking Event History
                    </h4>
                    <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                      {trackingDetails.dist.trackingHistory.map((history: any, idx: number) => (
                        <div key={idx} className="bg-background/60 border border-border/60 p-2.5 rounded flex items-start gap-3">
                          <div className="w-2 h-2 rounded-full bg-accent mt-1.5 shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-center">
                              <span className="font-bold text-text-primary">{history.status}</span>
                              <span className="text-[10px] text-text-secondary">{history.statusDate}</span>
                            </div>
                            {history.comments && (
                              <p className="text-[11px] text-text-secondary mt-0.5">{history.comments}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="text-xs italic text-text-secondary text-center py-2">
                    Shipment created. Pending courier hub scanned events.
                  </p>
                )}
              </div>
            ) : (
              <div className="py-6 text-center text-xs text-text-secondary">
                No tracking information found or invalid tracking number.
              </div>
            )}

            <div className="flex justify-end pt-3 border-t border-border">
              <button
                onClick={() => setTrackingModalOpen(false)}
                className="px-4 py-1.5 border border-border rounded text-xs font-semibold uppercase hover:bg-surface"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
