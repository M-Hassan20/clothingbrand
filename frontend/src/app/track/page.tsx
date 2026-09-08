'use client';

import React, { useState, useEffect } from 'react';
import { Search, Truck, Package, Clock, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function PublicTrackPage() {
  const [trackingNumber, setTrackingNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [trackingData, setTrackingData] = useState<any>(null);
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    document.title = 'Track Your Order | Haus of Hafsah';
  }, []);

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackingNumber.trim()) return;

    try {
      setLoading(true);
      setSearched(true);
      setTrackingData(null);
      const res = await fetch(`/api/tracking/${encodeURIComponent(trackingNumber.trim())}`);
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
    <div className="max-w-3xl mx-auto px-4 py-12 font-sans space-y-8">
      <div className="text-center space-y-3 border-b border-border/40 pb-8">
        <div className="inline-flex p-3 rounded-full bg-accent/10 text-accent mb-2">
          <Truck className="h-8 w-8" />
        </div>
        <h1 className="font-serif text-3xl text-charcoal tracking-wide">
          Track Your Shipment
        </h1>
        <p className="text-xs text-brown-muted max-w-md mx-auto leading-relaxed">
          Enter your PostEx tracking waybill number below to get real-time delivery status updates.
        </p>
      </div>

      <form onSubmit={handleTrack} className="flex gap-2 max-w-xl mx-auto">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-brown-muted" />
          <Input
            type="text"
            placeholder="e.g. 123456789012"
            value={trackingNumber}
            onChange={(e) => setTrackingNumber(e.target.value)}
            className="pl-10 text-xs bg-beige/10 border-border focus:border-accent font-mono h-11"
          />
        </div>
        <Button
          type="submit"
          disabled={loading || !trackingNumber.trim()}
          className="bg-accent text-background hover:bg-accent/90 text-xs font-semibold px-6 h-11 uppercase tracking-wider"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Track Parcel'}
        </Button>
      </form>

      {searched && (
        <div className="space-y-6 pt-4">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 space-y-3">
              <Loader2 className="h-8 w-8 animate-spin text-accent" />
              <p className="text-xs text-brown-muted">Connecting to PostEx logistics API...</p>
            </div>
          ) : trackingData?.dist ? (
            <div className="border border-border/60 rounded-lg p-6 bg-background space-y-6 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-border/40 pb-4 gap-3">
                <div>
                  <span className="text-[10px] text-brown-muted uppercase tracking-wider block font-semibold">
                    Tracking Number
                  </span>
                  <span className="font-mono font-bold text-charcoal text-base">
                    #{trackingData.dist.trackingNumber || trackingNumber}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-brown-muted">Status:</span>
                  <span className="inline-flex px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-accent/15 text-accent border border-accent/30">
                    {trackingData.dist.transactionStatus || 'In Transit'}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs bg-beige/10 p-4 rounded-md border border-border/40">
                <div>
                  <span className="text-[10px] text-brown-muted uppercase block">Recipient</span>
                  <span className="font-semibold text-charcoal">{trackingData.dist.customerName || 'Customer'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-brown-muted uppercase block">Destination City</span>
                  <span className="font-semibold text-charcoal">{trackingData.dist.cityName || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-brown-muted uppercase block">Courier Partner</span>
                  <span className="font-semibold text-charcoal">PostEx Express</span>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-serif text-sm font-semibold text-charcoal uppercase tracking-wider border-b border-border/40 pb-2">
                  Tracking Event Timeline
                </h3>

                {trackingData.dist.trackingHistory && trackingData.dist.trackingHistory.length > 0 ? (
                  <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-accent/30">
                    {trackingData.dist.trackingHistory.map((item: any, idx: number) => (
                      <div key={idx} className="relative">
                        <div className="absolute -left-[21px] top-0.5 w-3 h-3 rounded-full bg-accent border-2 border-background" />
                        <div className="text-xs space-y-0.5">
                          <div className="flex justify-between items-center">
                            <h4 className="font-bold text-charcoal text-sm">{item.status}</h4>
                            <span className="text-[10px] text-brown-muted font-mono">{item.statusDate}</span>
                          </div>
                          {item.comments && (
                            <p className="text-[11px] text-brown-muted leading-relaxed">{item.comments}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-brown-muted italic text-center py-4">
                    Order booked. Courier scan events will update here as your parcel moves.
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div className="border border-dashed border-border/60 rounded-lg p-8 text-center bg-beige/10 space-y-2">
              <AlertCircle className="h-8 w-8 text-warning mx-auto" />
              <h3 className="font-serif text-base font-medium text-charcoal">No details found</h3>
              <p className="text-xs text-brown-muted max-w-sm mx-auto">
                We couldn't find tracking information for <strong>{trackingNumber}</strong>. Please check your tracking number or try again later.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
