'use client';

import React, { use, useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { ArrowLeft, Download, Trash2, MapPin, Loader2, RefreshCw, X } from 'lucide-react';
import { getOrderById, getOrderItems, cancelOrder, downloadOrderInvoice, requestReturn } from '@/lib/api/orders';
import { useAuthStore } from '@/lib/stores/auth-store';
import { OrderResponse, OrderItemResponse } from '@/types/api';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { OrderTrackingCard } from '@/components/OrderTrackingCard';

interface OrderDetailsPageProps {
  params: Promise<{ id: string }>;
}

export default function OrderDetailsPage({ params }: OrderDetailsPageProps) {
  const resolvedParams = use(params);
  const orderId = parseInt(resolvedParams.id, 10);
  const authUserId = useAuthStore((state) => state.userId);

  const [order, setOrder] = useState<OrderResponse | null>(null);
  const [items, setItems] = useState<OrderItemResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  // Return Modal States
  const [returnModalOpen, setReturnModalOpen] = useState(false);
  const [submittingReturn, setSubmittingReturn] = useState(false);
  const [returnReason, setReturnReason] = useState('Wrong Size / Fit Issue');
  const [returnResolution, setReturnResolution] = useState<'REFUND' | 'EXCHANGE'>('REFUND');
  const [returnBankDetails, setReturnBankDetails] = useState('');
  const [requestedSize, setRequestedSize] = useState('Medium');
  const [returnRemarks, setReturnRemarks] = useState('');

  useEffect(() => {
    document.title = `Order #${orderId} | Haus of Hafsah`;
  }, [orderId]);

  const fetchOrderDetails = useCallback(async () => {
    try {
      setLoading(true);
      const [orderData, itemsData] = await Promise.all([
        getOrderById(orderId),
        getOrderItems(orderId),
      ]);
      setOrder(orderData);
      setItems(itemsData);
    } catch (error) {
      console.error('Failed to load order detail:', error);
      toast.error('Failed to load order details');
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    fetchOrderDetails();
  }, [fetchOrderDetails]);

  const handleCancelOrder = async () => {
    if (!order || !authUserId) return;
    if (!window.confirm('Are you sure you want to cancel this order?')) return;

    try {
      setUpdating(true);
      await cancelOrder(order.id, authUserId);
      toast.success('Order cancelled successfully');
      fetchOrderDetails();
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Failed to cancel order';
      toast.error(msg);
    } finally {
      setUpdating(false);
    }
  };

  const handleSubmitReturn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!order) return;
    try {
      setSubmittingReturn(true);
      await requestReturn(order.id, {
        reason: returnReason,
        resolution: returnResolution,
        bankDetails: returnResolution === 'REFUND' ? returnBankDetails : undefined,
        requestedSize: returnResolution === 'EXCHANGE' ? requestedSize : undefined,
        remarks: returnRemarks.trim() || undefined,
      });
      toast.success('Return/Exchange request submitted successfully! Our concierge team will review it.');
      setReturnModalOpen(false);
      fetchOrderDetails();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to submit return request');
    } finally {
      setSubmittingReturn(false);
    }
  };

  const handleDownloadInvoice = async () => {
    if (!order) return;
    try {
      const blob = await downloadOrderInvoice(order.id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `invoice-${order.id}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
    } catch {
      toast.error('Failed to download invoice');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toUpperCase()) {
      case 'DELIVERED':
        return 'bg-success/10 text-success border-success/20';
      case 'PENDING':
        return 'bg-warning/10 text-warning border-warning/20';
      case 'CANCELLED':
        return 'bg-error/10 text-error border-error/20';
      default:
        return 'bg-beige/40 text-brown-muted border-border/40';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-accent" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="text-center py-20 font-sans space-y-4">
        <p className="text-xs text-brown-muted">Order not found.</p>
        <Link href="/account/orders" passHref>
          <Button variant="outline" className="border-border text-charcoal hover:bg-blush/20 text-xs">
            Back to Orders
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8 font-sans">
      {/* Header Back Link */}
      <div className="flex justify-between items-center border-b border-border/40 pb-5">
        <div className="space-y-1">
          <Link
            href="/account/orders"
            className="inline-flex items-center gap-1.5 text-xs text-brown-muted hover:text-charcoal transition-colors mb-2 font-semibold"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Orders
          </Link>
          <h1 className="font-serif text-2xl text-charcoal tracking-wide">
            Order #{order.id}
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {(order.status.toUpperCase() === 'PENDING' || order.status.toUpperCase() === 'PROCESSING') && (
            <Button
              variant="outline"
              disabled={updating}
              onClick={handleCancelOrder}
              className="border-error/40 text-error hover:bg-error/5 text-xs font-semibold px-4 py-2 rounded-md flex items-center gap-1.5 cursor-pointer"
            >
              <Trash2 className="h-4 w-4" />
              Cancel Order
            </Button>
          )}

          {order.status.toUpperCase() === 'DELIVERED' && (
            <Button
              variant="outline"
              onClick={() => setReturnModalOpen(true)}
              className="border-accent text-accent hover:bg-accent/10 text-xs font-semibold px-4 py-2 rounded-md flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className="h-4 w-4" />
              {order.returnStatus ? `Return Request (${order.returnStatus})` : 'Request Return / Exchange'}
            </Button>
          )}

          <Button
            onClick={handleDownloadInvoice}
            className="bg-accent text-background hover:bg-accent/90 text-xs font-semibold px-4 py-2 rounded-md flex items-center gap-1.5"
          >
            <Download className="h-4 w-4" />
            Invoice
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Panels: Items list */}
        <div className="lg:col-span-2 space-y-6">
          {order.returnStatus && (
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-md p-4 space-y-1 text-xs font-sans">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-amber-900 font-serif">Return / Exchange Request ({order.returnStatus})</span>
                <button
                  type="button"
                  onClick={() => setReturnModalOpen(true)}
                  className="text-[11px] underline text-accent font-semibold cursor-pointer"
                >
                  View / Edit Request
                </button>
              </div>
              <p className="text-[11px] text-amber-900/80">
                Reason: <strong>{order.returnReason || 'N/A'}</strong> ({order.returnResolution || 'REFUND'})
              </p>
            </div>
          )}

          <div className="border border-border/60 rounded-md p-5 bg-background space-y-4">
            <h3 className="font-serif text-sm font-semibold uppercase tracking-wider text-charcoal pb-2 border-b border-border/40">
              Ordered Items
            </h3>
            
            <div className="divide-y divide-border/40">
              {items.map((item) => (
                <div key={item.id} className="py-4 flex gap-4 first:pt-0">
                  <div className="flex-1 flex justify-between text-xs">
                    <div>
                      <h4 className="font-serif text-charcoal font-semibold">{item.productName}</h4>
                      <p className="mt-1 text-[10px] text-brown-muted">Variant: {item.variantName}</p>
                      <p className="mt-0.5 text-[10px] text-brown-muted">Unit price: Rs. {item.price.toFixed(2)}</p>
                    </div>
                    <div className="text-right space-y-1">
                      <span className="block text-brown-muted">Qty: {item.quantity}</span>
                      <span className="block font-bold text-charcoal">Rs. {(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {order.trackingNumber && (
            <OrderTrackingCard
              trackingNumber={order.trackingNumber}
              courierName={order.courierName || 'PostEx'}
              postexStatus={order.postexStatus}
            />
          )}
        </div>

        {/* Right Panel: Delivery & Summary */}
        <div className="space-y-6">
          {/* Order Summary Details */}
          <div className="border border-border/60 rounded-md p-5 bg-beige/5 space-y-4 text-xs">
            <h3 className="font-serif text-sm font-semibold uppercase tracking-wider text-charcoal pb-2 border-b border-border/40">
              Summary
            </h3>
            
            <div className="space-y-3 text-brown-muted">
              <div className="flex justify-between">
                <span>Date Placed:</span>
                <span className="text-charcoal font-medium">
                  {new Date(order.createdAt).toLocaleDateString(undefined, {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  })}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Status:</span>
                <span className={`inline-block border px-2.5 py-0.5 rounded-full font-bold text-[9px] uppercase tracking-wider ${getStatusColor(order.status)}`}>
                  {order.status}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Delivery:</span>
                {(() => {
                  if (order.shippingFee !== undefined && order.shippingFee !== null) {
                    return order.shippingFee > 0 ? (
                      <span className="text-charcoal font-medium">Rs. {Number(order.shippingFee).toFixed(2)}</span>
                    ) : (
                      <span className="text-success font-semibold">Complimentary</span>
                    );
                  }
                  const itemSubtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
                  const disc = order.discountAmount || 0;
                  const netSub = itemSubtotal - disc;
                  const calculatedFee = (order.totalAmount || 0) - netSub;
                  return calculatedFee > 0 ? (
                    <span className="text-charcoal font-medium">Rs. {calculatedFee.toFixed(2)}</span>
                  ) : (
                    <span className="text-success font-semibold">Complimentary</span>
                  );
                })()}
              </div>
              
              <div className="border-t border-border/40 pt-3 flex justify-between text-sm font-bold text-charcoal">
                <span>Total Amount:</span>
                <span>Rs. {Number(order.totalAmount ?? (order as { totalPrice?: number }).totalPrice ?? 0).toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Shipping Address details */}
          <div className="border border-border/60 rounded-md p-5 bg-background space-y-4 text-xs">
            <h3 className="font-serif text-sm font-semibold uppercase tracking-wider text-charcoal pb-2 border-b border-border/40">
              Shipping Address
            </h3>
            <div className="flex gap-2 text-brown-muted leading-relaxed">
              <MapPin className="h-4 w-4 text-accent shrink-0 mt-0.5" />
              <div>
                {order.shippingAddress ? (
                  <>
                    <p className="font-bold text-charcoal capitalize mb-1">{order.shippingAddress.label}</p>
                    <p>{order.shippingAddress.street}</p>
                    <p>{order.shippingAddress.city}, {order.shippingAddress.zipCode}</p>
                    <p>{order.shippingAddress.country}</p>
                  </>
                ) : (
                  <p className="italic">Address details unavailable.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Return / Exchange Request Modal */}
      {returnModalOpen && order && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-background border border-border rounded-lg shadow-xl w-full max-w-lg p-6 space-y-5 animate-in fade-in zoom-in-95 font-sans">
            <div className="flex justify-between items-center border-b border-border/60 pb-3">
              <div>
                <h3 className="font-serif text-lg font-semibold text-charcoal">
                  Request Return or Exchange
                </h3>
                <p className="text-[11px] text-brown-muted">Order #{order.id}</p>
              </div>
              <button
                type="button"
                onClick={() => setReturnModalOpen(false)}
                className="text-brown-muted hover:text-charcoal transition-colors p-1"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitReturn} className="space-y-4 text-xs">
              <div>
                <label className="block text-[11px] font-semibold text-charcoal uppercase tracking-wider mb-1">
                  Preferred Resolution
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setReturnResolution('REFUND')}
                    className={`p-3 rounded-md border text-left flex flex-col gap-1 transition-all ${
                      returnResolution === 'REFUND'
                        ? 'border-accent bg-accent/10 text-charcoal font-semibold'
                        : 'border-border/60 text-brown-muted hover:border-border'
                    }`}
                  >
                    <span className="font-serif text-xs">Refund</span>
                    <span className="text-[10px] opacity-80">Return items for refund to original card or bank</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setReturnResolution('EXCHANGE')}
                    className={`p-3 rounded-md border text-left flex flex-col gap-1 transition-all ${
                      returnResolution === 'EXCHANGE'
                        ? 'border-accent bg-accent/10 text-charcoal font-semibold'
                        : 'border-border/60 text-brown-muted hover:border-border'
                    }`}
                  >
                    <span className="font-serif text-xs">Size Exchange</span>
                    <span className="text-[10px] opacity-80">Exchange for a different size or article</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-charcoal uppercase tracking-wider mb-1">
                  Reason for Return / Exchange
                </label>
                <select
                  value={returnReason}
                  onChange={(e) => setReturnReason(e.target.value)}
                  className="w-full bg-background border border-border/60 rounded-md p-2.5 text-xs text-charcoal focus:outline-none focus:ring-1 focus:ring-accent"
                >
                  <option value="Wrong Size / Fit Issue">Wrong Size / Fit Issue</option>
                  <option value="Defective / Damaged Item Received">Defective / Damaged Item Received</option>
                  <option value="Item Color or Fabric Not as Described">Item Color or Fabric Not as Described</option>
                  <option value="Changed Mind / Don't Want Item">Changed Mind / Don't Want Item</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              {returnResolution === 'EXCHANGE' && (
                <div>
                  <label className="block text-[11px] font-semibold text-charcoal uppercase tracking-wider mb-1">
                    Desired Replacement Size <span className="text-accent">*</span>
                  </label>
                  <select
                    value={requestedSize}
                    onChange={(e) => setRequestedSize(e.target.value)}
                    className="w-full bg-background border border-border/60 rounded-md p-2.5 text-xs text-charcoal font-semibold focus:outline-none focus:ring-1 focus:ring-accent"
                  >
                    <option value="XS">Extra Small (XS)</option>
                    <option value="Small">Small (S)</option>
                    <option value="Medium">Medium (M)</option>
                    <option value="Large">Large (L)</option>
                    <option value="XL">Extra Large (XL)</option>
                    <option value="XXL">Double Extra Large (XXL)</option>
                  </select>
                </div>
              )}

              {returnResolution === 'REFUND' && (
                <div>
                  <label className="block text-[11px] font-semibold text-charcoal uppercase tracking-wider mb-1">
                    Bank IBFT Account Details <span className="text-brown-muted font-normal">(Required for COD Cash Refunds)</span>
                  </label>
                  <textarea
                    rows={2}
                    value={returnBankDetails}
                    onChange={(e) => setReturnBankDetails(e.target.value)}
                    placeholder="Bank Name, Account Title, and IBAN Number (e.g. Meezan Bank, John Doe, PK36MEZN00000...)"
                    className="w-full bg-background border border-border/60 rounded-md p-2.5 text-xs text-charcoal focus:outline-none focus:ring-1 focus:ring-accent resize-none"
                  />
                </div>
              )}

              <div>
                <label className="block text-[11px] font-semibold text-charcoal uppercase tracking-wider mb-1">
                  Customer Remarks / Preferences <span className="text-brown-muted font-normal">(Optional)</span>
                </label>
                <textarea
                  rows={2}
                  value={returnRemarks}
                  onChange={(e) => setReturnRemarks(e.target.value)}
                  placeholder="Optional notes e.g., 'Please send Medium in Black if Small is unavailable', or fit instructions..."
                  className="w-full bg-background border border-border/60 rounded-md p-2.5 text-xs text-charcoal focus:outline-none focus:ring-1 focus:ring-accent resize-none"
                />
              </div>

              <div className="bg-beige/10 border border-border/40 p-3 rounded text-[11px] text-brown-muted leading-relaxed">
                ℹ️ Our concierge team will review your request within 24 hours. Items must be in original condition with all boutique tags intact.
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-border/40">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setReturnModalOpen(false)}
                  disabled={submittingReturn}
                  className="text-xs font-semibold px-4 py-2 border-border"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={submittingReturn}
                  className="bg-accent text-background hover:bg-accent/90 text-xs font-semibold px-5 py-2 flex items-center gap-1.5"
                >
                  {submittingReturn ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    'Submit Request'
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
