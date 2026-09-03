'use client';

import React, { use, useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { ArrowLeft, Download, Trash2, MapPin, Loader2 } from 'lucide-react';
import { getOrderById, getOrderItems, cancelOrder, downloadOrderInvoice } from '@/lib/api/orders';
import { useAuthStore } from '@/lib/stores/auth-store';
import { OrderResponse, OrderItemResponse } from '@/types/api';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

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

  useEffect(() => {
    document.title = `Order #${orderId} — Haus of Hafsah`;
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

        <div className="flex items-center gap-2">
          {order.status.toUpperCase() === 'PENDING' && (
            <Button
              variant="outline"
              disabled={updating}
              onClick={handleCancelOrder}
              className="border-error/40 text-error hover:bg-error/5 text-xs font-semibold px-4 py-2 rounded-md flex items-center gap-1.5"
            >
              <Trash2 className="h-4 w-4" />
              Cancel Order
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
                <span className="text-success font-semibold">Complimentary</span>
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
    </div>
  );
}
