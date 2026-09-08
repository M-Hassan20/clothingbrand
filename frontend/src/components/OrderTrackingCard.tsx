'use client';

import React, { useState } from 'react';
import { Truck, Package, CheckCircle2, Clock, MapPin, ExternalLink, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface OrderTrackingCardProps {
  trackingNumber: string;
  courierName?: string;
  postexStatus?: string;
}

export function OrderTrackingCard({ trackingNumber, courierName = 'PostEx', postexStatus }: OrderTrackingCardProps) {
  const [loading, setLoading] = useState(false);
  const [trackingData, setTrackingData] = useState<any>(null);
  const [isOpen, setIsOpen] = useState(false);

  const handleFetchTracking = async () => {
    try {
      setLoading(true);
      setIsOpen(true);
      const res = await fetch(`/api/tracking/${trackingNumber}`);
      if (res.ok) {
        const json = await res.json();
        setTrackingData(json?.data || json);
      }
    } catch (err) {
      console.error('Tracking fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="border border-accent/20 rounded-md p-5 bg-accent/5 space-y-4 font-sans text-xs">
      <div className="flex items-center justify-between border-b border-border/40 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="rounded-full bg-accent/10 p-2 text-accent">
            <Truck className="h-4 w-4" />
          </div>
          <div>
            <h3 className="font-serif text-sm font-semibold text-charcoal">
              {courierName} Shipment Tracking
            </h3>
            <p className="text-[11px] text-brown-muted font-mono">
              Waybill: #{trackingNumber}
            </p>
          </div>
        </div>

        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-accent/15 text-accent border border-accent/30">
          <Package className="h-3 w-3" />
          {postexStatus || 'Booked'}
        </span>
      </div>

      <div className="flex items-center justify-between pt-1">
        <p className="text-[11px] text-brown-muted">
          Your order is being handled by {courierName} for express door-to-door delivery.
        </p>

        <Button
          onClick={handleFetchTracking}
          variant="outline"
          size="sm"
          className="border-accent/40 text-accent hover:bg-accent/10 text-xs font-semibold flex items-center gap-1.5"
        >
          <ExternalLink className="h-3.5 w-3.5" />
          Live Details
        </Button>
      </div>

      {isOpen && (
        <div className="mt-4 pt-4 border-t border-border/40 space-y-3 bg-background/80 p-4 rounded-md border border-border/60">
          <div className="flex justify-between items-center">
            <h4 className="font-serif font-bold text-charcoal text-xs uppercase tracking-wider">
              Status Timeline
            </h4>
            <button
              onClick={() => setIsOpen(false)}
              className="text-[10px] text-brown-muted hover:text-charcoal underline"
            >
              Hide
            </button>
          </div>

          {loading ? (
            <div className="flex justify-center py-6">
              <Loader2 className="h-5 w-5 animate-spin text-accent" />
            </div>
          ) : trackingData?.dist ? (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2 text-[11px] bg-beige/10 p-2.5 rounded border border-border/40">
                <div>
                  <span className="text-[9px] text-brown-muted uppercase block">Status</span>
                  <span className="font-bold text-accent">{trackingData.dist.transactionStatus}</span>
                </div>
                <div>
                  <span className="text-[9px] text-brown-muted uppercase block">Destination City</span>
                  <span className="font-semibold text-charcoal">{trackingData.dist.cityName}</span>
                </div>
              </div>

              {trackingData.dist.trackingHistory && trackingData.dist.trackingHistory.length > 0 ? (
                <div className="space-y-2 pt-2">
                  {trackingData.dist.trackingHistory.map((item: any, idx: number) => (
                    <div key={idx} className="flex gap-3 text-xs items-start border-l-2 border-accent/40 pl-3 py-1">
                      <div className="flex-1">
                        <p className="font-semibold text-charcoal">{item.status}</p>
                        <p className="text-[10px] text-brown-muted">{item.statusDate}</p>
                        {item.comments && <p className="text-[11px] text-brown-muted italic mt-0.5">{item.comments}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[11px] italic text-brown-muted">Shipment dispatched. Hub updates will appear shortly.</p>
              )}
            </div>
          ) : (
            <p className="text-[11px] text-brown-muted italic py-2">
              Unable to retrieve detailed tracking history at this moment.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
