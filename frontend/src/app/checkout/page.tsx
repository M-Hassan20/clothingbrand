'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { CheckCircle2, ChevronRight, ArrowLeft, Download, MapPin, Loader2 } from 'lucide-react';
import { useCartStore } from '@/lib/stores/cart-store';
import { useAuthStore } from '@/lib/stores/auth-store';
import { getAddresses, createAddress } from '@/lib/api/addresses';
import { createOrder, createGuestOrder, downloadOrderInvoice } from '@/lib/api/orders';
import { initiateSafePayCheckout } from '@/lib/api/payment';
import { clearCart, getCart } from '@/lib/api/cart';
import { validateDiscountCode } from '@/lib/api/discounts';
import { AddressResponse, AddressCreateRequest, OrderResponse } from '@/types/api';
import AddressSelector from '@/components/checkout/AddressSelector';
import OrderSummary from '@/components/checkout/OrderSummary';
import PaymentStep, { PaymentIntentType } from '@/components/checkout/PaymentStep';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export default function CheckoutPage() {
  const router = useRouter();
  const {
    cart,
    setCart,
    getEffectiveUserId,
    appliedDiscountCode,
    discountAmount,
    setDiscount,
    clearDiscount,
  } = useCartStore();
  const { userId: authUserId, isAuthenticated } = useAuthStore();
  const userId = getEffectiveUserId(authUserId);

  const [step, setStep] = useState<'shipping' | 'payment' | 'confirmation'>('shipping');
  const [paymentMethod, setPaymentMethod] = useState<'cod' | 'card'>('cod');
  const [cardIntent, setCardIntent] = useState<PaymentIntentType>('CYBERSOURCE');
  const [addresses, setAddresses] = useState<AddressResponse[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [createdOrder, setCreatedOrder] = useState<OrderResponse | null>(null);

  const [guestInfo, setGuestInfo] = useState({
    guestName: '',
    guestEmail: '',
    guestPhone: '',
    shippingStreet: '',
    shippingCity: '',
    shippingCountry: '',
    shippingZipCode: '',
  });

  const items = cart?.items || [];
  const totalPrice = cart?.totalPrice || 0;

  const fetchCartData = useCallback(async () => {
    try {
      const updatedCart = await getCart(userId);
      setCart(updatedCart);
    } catch (error) {
      console.error('Failed to load cart on checkout:', error);
    } finally {
      setIsInitializing(false);
    }
  }, [userId, setCart]);

  useEffect(() => {
    document.title = 'Checkout | Haus of Hafsah';
  }, []);

  useEffect(() => {
    fetchCartData();
  }, [fetchCartData]);

  const handleApplyDiscount = async (code: string) => {
    if (appliedDiscountCode) {
      toast.error('A promo code is already applied. Remove it first to use another.');
      return;
    }
    const res = await validateDiscountCode(code, totalPrice);
    if (res.valid) {
      setDiscount(res.code, res.discountAmount);
      toast.success(`Promo code ${res.code} applied! Saved Rs. ${res.discountAmount.toFixed(2)}`);
    } else {
      throw new Error(res.message || 'Invalid promo code');
    }
  };

  const handleRemoveDiscount = () => {
    clearDiscount();
    toast.info('Promo code removed');
  };

  useEffect(() => {
    // Redirect if initialization is finished, cart is empty, and not on confirmation page
    if (!isInitializing && step !== 'confirmation') {
      if (!cart || !cart.items || cart.items.length === 0) {
        toast.error('Your bag is empty.');
        router.push('/cart');
      }
    }
  }, [isInitializing, cart, step, router]);

  const fetchAddresses = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const list = await getAddresses(userId);
      setAddresses(list);
      const defaultAddr = list.find((a) => a.isDefault);
      if (defaultAddr) {
        setSelectedAddressId(defaultAddr.id);
      } else if (list.length > 0) {
        setSelectedAddressId(list[0].id);
      }
    } catch (error) {
      console.error('Failed to load addresses:', error);
    }
  }, [userId, isAuthenticated]);

  useEffect(() => {
    fetchAddresses();
  }, [fetchAddresses]);

  const handleCreateAddress = async (values: AddressCreateRequest) => {
    try {
      const newAddress = await createAddress(userId, values);
      setAddresses((prev) => [...prev, newAddress]);
      setSelectedAddressId(newAddress.id);
      toast.success('Address saved successfully');
    } catch {
      toast.error('Failed to save address');
    }
  };

  const handlePlaceOrder = async () => {
    if (isAuthenticated && !selectedAddressId) {
      toast.error('Please select a shipping address');
      return;
    }

    if (!isAuthenticated) {
      const { guestName, guestEmail, guestPhone, shippingStreet, shippingCity, shippingCountry, shippingZipCode } = guestInfo;
      if (!guestName || !guestEmail || !guestPhone || !shippingStreet || !shippingCity || !shippingCountry || !shippingZipCode) {
        toast.error('Please fill in all shipping and contact details');
        return;
      }
    }

    try {
      setLoading(true);
      let order: OrderResponse;

      if (isAuthenticated) {
        order = await createOrder(userId, {
          shippingAddressId: selectedAddressId!,
          items: items.map((item) => ({
            productVariantId: item.productVariantId,
            quantity: item.quantity,
          })),
          discountCode: appliedDiscountCode,
        });
      } else {
        order = await createGuestOrder({
          guestName: guestInfo.guestName,
          guestEmail: guestInfo.guestEmail,
          guestPhone: guestInfo.guestPhone,
          shippingStreet: guestInfo.shippingStreet,
          shippingCity: guestInfo.shippingCity,
          shippingCountry: guestInfo.shippingCountry,
          shippingZipCode: guestInfo.shippingZipCode,
          items: items.map((item) => ({
            productVariantId: item.productVariantId,
            quantity: item.quantity,
          })),
          discountCode: appliedDiscountCode,
        });
      }

      if (paymentMethod === 'card') {
        toast.loading(`Redirecting to SafePay (${cardIntent})...`);
        const session = await initiateSafePayCheckout(order.id, cardIntent);
        
        // Redirect browser to SafePay checkout (Cart is preserved until backend confirms payment)
        window.location.href = session.checkoutUrl;
        return;
      }

      setCreatedOrder(order);
      // Clear cart
      await clearCart(userId);
      setCart({
        userId,
        items: [],
        totalPrice: 0,
        lastUpdated: new Date().toISOString(),
      });
      clearDiscount();

      setStep('confirmation');
      toast.success('Order placed successfully!');
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Failed to place order';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadInvoice = async (orderId: number) => {
    try {
      const blob = await downloadOrderInvoice(orderId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `invoice-${orderId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
    } catch {
      toast.error('Failed to download invoice');
    }
  };

  if (isInitializing && (!cart || !cart.items || cart.items.length === 0)) {
    return (
      <div className="w-full bg-background min-h-[calc(100vh-4rem)] flex items-center justify-center py-24">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-accent" />
          <p className="font-serif text-sm text-brown-muted tracking-wide">Loading checkout details...</p>
        </div>
      </div>
    );
  }

  if (step === 'confirmation' && createdOrder) {
    const orderTotal = Number(createdOrder.totalAmount ?? (createdOrder as { totalPrice?: number }).totalPrice ?? 0);
    return (
      <div className="w-full bg-background min-h-[calc(100vh-4rem)] flex items-center py-16">
        <div className="mx-auto max-w-lg px-4 text-center space-y-6">
          <div className="inline-flex rounded-full bg-success/15 p-4 text-success animate-bounce">
            <CheckCircle2 className="h-12 w-12" />
          </div>
          <div className="space-y-2">
            <h1 className="font-serif text-3xl text-charcoal tracking-wide">
              Order Confirmed
            </h1>
            <p className="font-sans text-xs text-brown-muted">
              Thank you for shopping with Haus of Hafsah. Your order has been placed.
            </p>
          </div>

          <div className="bg-beige/10 border border-border/40 rounded-md p-6 space-y-4 text-left font-sans text-xs">
            <div className="flex justify-between border-b border-border/40 pb-3">
              <span className="text-brown-muted">Order Number</span>
              <span className="font-semibold text-charcoal">#{createdOrder.id}</span>
            </div>
            <div className="flex justify-between border-b border-border/40 pb-3">
              <span className="text-brown-muted">Total Amount</span>
              <span className="font-semibold text-charcoal">Rs. {orderTotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-brown-muted">Payment Method</span>
              <span className="font-semibold text-charcoal">Cash on Delivery</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
            <Button
              onClick={() => handleDownloadInvoice(createdOrder.id)}
              className="bg-accent text-background hover:bg-accent/90 text-xs font-semibold px-6 py-2.5 rounded-md flex items-center justify-center gap-1.5"
            >
              <Download className="h-4 w-4" />
              Download Invoice
            </Button>
            <Link href="/shop" passHref>
              <Button variant="outline" className="border-border text-charcoal hover:bg-blush/20 text-xs font-semibold px-6 py-2.5 rounded-md w-full sm:w-auto">
                Continue Shopping
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-background min-h-[calc(100vh-4rem)]">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center gap-2 text-xs font-sans text-brown-muted mb-8">
          <Link href="/cart" className="hover:text-charcoal transition-colors">
            Bag
          </Link>
          <ChevronRight className="h-3 w-3" />
          <span className={step === 'shipping' ? 'text-charcoal font-semibold' : ''}>Shipping</span>
          <ChevronRight className="h-3 w-3" />
          <span className={step === 'payment' ? 'text-charcoal font-semibold' : ''}>Payment</span>
        </div>

        <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 items-start">
          {/* Left Panel: Accordion steps */}
          <div className="lg:col-span-8 space-y-6">
            {/* Step 1: Shipping Address */}
            <div className="border border-border/40 rounded-md p-6 bg-background space-y-6">
              <div className="flex items-center gap-3 border-b border-border/40 pb-4 justify-between">
                <div className="flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-beige text-charcoal font-sans text-xs font-semibold">
                    1
                  </span>
                  <h2 className="font-serif text-base font-semibold text-charcoal tracking-wide">
                    Shipping Details
                  </h2>
                </div>
                {step === 'payment' && (
                  <button
                    onClick={() => setStep('shipping')}
                    className="font-sans text-[11px] text-accent hover:underline font-semibold"
                  >
                    Edit
                  </button>
                )}
              </div>

              {step === 'shipping' ? (
                <div className="space-y-6">
                  {isAuthenticated ? (
                    <AddressSelector
                      addresses={addresses}
                      selectedAddressId={selectedAddressId}
                      onSelectAddress={setSelectedAddressId}
                      onCreateNewAddress={handleCreateAddress}
                    />
                  ) : (
                    <div className="space-y-6 font-sans text-xs">
                      <div>
                        <h3 className="font-serif text-sm font-semibold text-charcoal tracking-wide mb-3">Contact Information</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-[10px] font-bold text-brown-muted uppercase tracking-wider mb-1">
                              Full Name
                            </label>
                            <input
                              type="text"
                              value={guestInfo.guestName}
                              onChange={(e) => setGuestInfo({ ...guestInfo, guestName: e.target.value })}
                              className="w-full rounded-md border border-border px-3 py-2 text-xs focus:border-accent focus:outline-none bg-background text-charcoal"
                              placeholder="Your full name"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-brown-muted uppercase tracking-wider mb-1">
                              Email Address
                            </label>
                            <input
                              type="email"
                              value={guestInfo.guestEmail}
                              onChange={(e) => setGuestInfo({ ...guestInfo, guestEmail: e.target.value })}
                              className="w-full rounded-md border border-border px-3 py-2 text-xs focus:border-accent focus:outline-none bg-background text-charcoal"
                              placeholder="your.email@example.com"
                            />
                          </div>
                          <div className="sm:col-span-2">
                            <label className="block text-[10px] font-bold text-brown-muted uppercase tracking-wider mb-1">
                              Phone Number
                            </label>
                            <input
                              type="text"
                              value={guestInfo.guestPhone}
                              onChange={(e) => setGuestInfo({ ...guestInfo, guestPhone: e.target.value })}
                              className="w-full rounded-md border border-border px-3 py-2 text-xs focus:border-accent focus:outline-none bg-background text-charcoal"
                              placeholder="e.g. +123456789"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="border-t border-border/40 pt-4">
                        <h3 className="font-serif text-sm font-semibold text-charcoal tracking-wide mb-3">Shipping Address</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="sm:col-span-2">
                            <label className="block text-[10px] font-bold text-brown-muted uppercase tracking-wider mb-1">
                              Street Address
                            </label>
                            <input
                              type="text"
                              value={guestInfo.shippingStreet}
                              onChange={(e) => setGuestInfo({ ...guestInfo, shippingStreet: e.target.value })}
                              className="w-full rounded-md border border-border px-3 py-2 text-xs focus:border-accent focus:outline-none bg-background text-charcoal"
                              placeholder="Street name, apartment, suite, etc."
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-brown-muted uppercase tracking-wider mb-1">
                              City
                            </label>
                            <input
                              type="text"
                              value={guestInfo.shippingCity}
                              onChange={(e) => setGuestInfo({ ...guestInfo, shippingCity: e.target.value })}
                              className="w-full rounded-md border border-border px-3 py-2 text-xs focus:border-accent focus:outline-none bg-background text-charcoal"
                              placeholder="City"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-brown-muted uppercase tracking-wider mb-1">
                              Zip Code
                            </label>
                            <input
                              type="text"
                              value={guestInfo.shippingZipCode}
                              onChange={(e) => setGuestInfo({ ...guestInfo, shippingZipCode: e.target.value })}
                              className="w-full rounded-md border border-border px-3 py-2 text-xs focus:border-accent focus:outline-none bg-background text-charcoal"
                              placeholder="Postal / Zip Code"
                            />
                          </div>
                          <div className="sm:col-span-2">
                            <label className="block text-[10px] font-bold text-brown-muted uppercase tracking-wider mb-1">
                              Country
                            </label>
                            <input
                              type="text"
                              value={guestInfo.shippingCountry}
                              onChange={(e) => setGuestInfo({ ...guestInfo, shippingCountry: e.target.value })}
                              className="w-full rounded-md border border-border px-3 py-2 text-xs focus:border-accent focus:outline-none bg-background text-charcoal"
                              placeholder="Country"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  <div className="flex justify-end pt-4 border-t border-border/40">
                    <Button
                      onClick={() => {
                        if (isAuthenticated) {
                          if (!selectedAddressId) {
                            toast.error('Please select a shipping address');
                            return;
                          }
                        } else {
                          const { guestName, guestEmail, guestPhone, shippingStreet, shippingCity, shippingCountry, shippingZipCode } = guestInfo;
                          if (!guestName || !guestEmail || !guestPhone || !shippingStreet || !shippingCity || !shippingCountry || !shippingZipCode) {
                            toast.error('Please fill in all shipping and contact details');
                            return;
                          }
                          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                          if (!emailRegex.test(guestEmail)) {
                            toast.error('Please enter a valid email address');
                            return;
                          }
                        }
                        setStep('payment');
                      }}
                      className="bg-accent text-background hover:bg-accent/90 text-xs font-semibold px-6 py-2.5 rounded-md"
                    >
                      Continue to Payment
                    </Button>
                  </div>
                </div>
              ) : (
                /* Collapsed Preview */
                isAuthenticated ? (
                  selectedAddressId && (
                    <div className="font-sans text-xs text-brown-muted flex items-start gap-2 pt-2">
                      <MapPin className="h-4 w-4 text-accent shrink-0 mt-0.5" />
                      <div>
                        {addresses.find((a) => a.id === selectedAddressId)?.street},{' '}
                        {addresses.find((a) => a.id === selectedAddressId)?.city}
                      </div>
                    </div>
                  )
                ) : (
                  guestInfo.shippingStreet && (
                    <div className="font-sans text-xs text-brown-muted flex items-start gap-2 pt-2">
                      <MapPin className="h-4 w-4 text-accent shrink-0 mt-0.5" />
                      <div>
                        {guestInfo.guestName} ({guestInfo.guestEmail})<br />
                        {guestInfo.shippingStreet}, {guestInfo.shippingCity}, {guestInfo.shippingCountry}
                      </div>
                    </div>
                  )
                )
              )}
            </div>

            {/* Step 2: Payment info */}
            <div className="border border-border/40 rounded-md p-6 bg-background space-y-6">
              <div className="flex items-center gap-2 border-b border-border/40 pb-4">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-beige text-charcoal font-sans text-xs font-semibold">
                  2
                  </span>
                <h2 className="font-serif text-base font-semibold text-charcoal tracking-wide">
                  Payment Details
                </h2>
              </div>

              {step === 'payment' && (
                <div className="space-y-6">
                  <PaymentStep
                    paymentMethod={paymentMethod}
                    cardIntent={cardIntent}
                    onPaymentMethodChange={setPaymentMethod}
                    onCardIntentChange={setCardIntent}
                    onPlaceOrder={handlePlaceOrder}
                    loading={loading}
                  />
                  <button
                    onClick={() => setStep('shipping')}
                    className="font-sans text-xs text-brown-muted hover:text-charcoal flex items-center gap-1.5 mt-2"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" />
                    Back to Shipping
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Right Panel: Order Review Sidebar */}
          <div className="lg:col-span-4 space-y-6">
            <OrderSummary
              items={items}
              totalPrice={totalPrice}
              appliedCode={appliedDiscountCode}
              discountAmount={discountAmount}
              onApplyDiscount={handleApplyDiscount}
              onRemoveDiscount={handleRemoveDiscount}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
