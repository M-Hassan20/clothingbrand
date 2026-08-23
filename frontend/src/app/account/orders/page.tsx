'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ShoppingBag, ChevronRight, Loader2, Calendar } from 'lucide-react';
import { getOrders } from '@/lib/api/orders';
import { useAuthStore } from '@/lib/stores/auth-store';
import { OrderResponse } from '@/types/api';

export default function AccountOrdersPage() {
  const authUserId = useAuthStore((state) => state.userId);
  const [orders, setOrders] = useState<OrderResponse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      if (!authUserId) return;
      try {
        setLoading(true);
        const list = await getOrders(authUserId);
        setOrders(list);
      } catch (error) {
        console.error('Failed to load orders:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, [authUserId]);

  const getStatusColor = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'DELIVERED':
        return 'bg-success/10 text-success border-success/20';
      case 'SHIPPED':
      case 'PROCESSING':
        return 'bg-accent/10 text-accent border-accent/20';
      case 'PENDING':
        return 'bg-warning/10 text-warning border-warning/20';
      case 'CANCELLED':
        return 'bg-error/10 text-error border-error/20';
      default:
        return 'bg-beige/40 text-brown-muted border-border/40';
    }
  };

  const getPaymentStatusColor = (status?: string) => {
    switch (status?.toUpperCase()) {
      case 'SUCCESS':
        return 'bg-success/10 text-success border-success/20';
      case 'INITIATED':
      case 'PENDING':
        return 'bg-warning/10 text-warning border-warning/20';
      case 'FAILED':
        return 'bg-error/10 text-error border-error/20';
      case 'REFUNDED':
      case 'PARTIALLY_REFUNDED':
        return 'bg-charcoal/10 text-charcoal border-charcoal/20';
      default:
        return 'bg-beige/40 text-brown-muted border-border/40';
    }
  };

  return (
    <div className="space-y-8 font-sans">
      <div className="border-b border-border/40 pb-5">
        <h1 className="font-serif text-2xl text-charcoal tracking-wide">
          Order History
        </h1>
        <p className="text-xs text-brown-muted mt-1">
          Track and review your orders.
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-accent" />
        </div>
      ) : orders.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center space-y-4 bg-beige/10 rounded-md border border-dashed border-border/50">
          <div className="rounded-full bg-beige/35 p-4 text-brown-muted">
            <ShoppingBag className="h-10 w-10" />
          </div>
          <div className="space-y-1">
            <h2 className="font-serif text-lg font-medium text-charcoal">No orders found</h2>
            <p className="text-xs text-brown-muted max-w-[280px]">
              You have not placed any orders yet.
            </p>
          </div>
          <Link href="/shop" passHref>
            <button className="bg-accent text-background hover:bg-accent/90 text-xs font-semibold px-6 py-2.5 rounded-md mt-2">
              Shop Now
            </button>
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div
              key={order.id}
              className="border border-border/60 rounded-md p-5 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:border-charcoal/40 transition-colors bg-background"
            >
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 flex-1 text-xs">
                <div>
                  <span className="block text-[10px] text-brown-muted uppercase tracking-wider mb-1 font-semibold">
                    Order Number
                  </span>
                  <span className="font-semibold text-charcoal">#{order.id}</span>
                </div>
                <div>
                  <span className="block text-[10px] text-brown-muted uppercase tracking-wider mb-1 font-semibold">
                    Date Placed
                  </span>
                  <span className="text-charcoal flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5 text-brown-muted shrink-0" />
                    {new Date(order.createdAt).toLocaleDateString(undefined, {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </span>
                </div>
                <div>
                  <span className="block text-[10px] text-brown-muted uppercase tracking-wider mb-1 font-semibold">
                    Total Amount
                  </span>
                  <span className="font-bold text-charcoal">
                    ${Number(order.totalAmount ?? (order as { totalPrice?: number }).totalPrice ?? 0).toFixed(2)}
                  </span>
                </div>
                <div>
                  <span className="block text-[10px] text-brown-muted uppercase tracking-wider mb-1 font-semibold">
                    Status
                  </span>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span
                      className={`inline-block border px-2 py-0.5 rounded-full font-bold text-[9px] uppercase tracking-wider ${getStatusColor(
                        order.status
                      )}`}
                    >
                      {order.status}
                    </span>
                    {order.paymentStatus && (
                      <span
                        className={`inline-block border px-2 py-0.5 rounded-full font-bold text-[9px] uppercase tracking-wider ${getPaymentStatusColor(
                          order.paymentStatus
                        )}`}
                      >
                        PAYMENT: {order.paymentStatus}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4 justify-end pt-4 border-t border-border/40 md:pt-0 md:border-t-0 md:justify-start">
                <Link href={`/account/orders/${order.id}`} className="inline-flex items-center gap-1 text-xs font-semibold text-accent hover:underline">
                  View Details
                  <ChevronRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
