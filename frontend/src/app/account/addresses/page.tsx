'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Trash2, Check, Loader2 } from 'lucide-react';
import { getAddresses, createAddress, deleteAddress, updateAddress } from '@/lib/api/addresses';
import { useAuthStore } from '@/lib/stores/auth-store';
import { AddressResponse, AddressCreateRequest } from '@/types/api';
import AddressForm from '@/components/checkout/AddressForm';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export default function AccountAddressesPage() {
  const authUserId = useAuthStore((state) => state.userId);
  const [addresses, setAddresses] = useState<AddressResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [editingAddress, setEditingAddress] = useState<AddressResponse | null>(null);

  const fetchAddresses = useCallback(async () => {
    if (!authUserId) return;
    try {
      setLoading(true);
      const list = await getAddresses(authUserId);
      setAddresses(list);
    } catch (error) {
      console.error('Failed to fetch addresses:', error);
    } finally {
      setLoading(false);
    }
  }, [authUserId]);

  useEffect(() => {
    fetchAddresses();
  }, [fetchAddresses]);

  const handleCreateAddress = async (values: AddressCreateRequest) => {
    if (!authUserId) return;
    try {
      await createAddress(authUserId, values);
      toast.success('Address saved successfully');
      setIsAddingNew(false);
      fetchAddresses();
    } catch {
      toast.error('Failed to create address');
    }
  };

  const handleUpdateAddress = async (values: AddressCreateRequest) => {
    if (!authUserId || !editingAddress) return;
    try {
      await updateAddress(editingAddress.id, authUserId, values);
      toast.success('Address updated successfully');
      setEditingAddress(null);
      fetchAddresses();
    } catch {
      toast.error('Failed to update address');
    }
  };

  const handleDeleteAddress = async (id: number) => {
    if (!authUserId) return;
    try {
      await deleteAddress(id, authUserId);
      toast.success('Address deleted successfully');
      fetchAddresses();
    } catch {
      toast.error('Failed to delete address');
    }
  };

  const handleSetDefaultAddress = async (address: AddressResponse) => {
    if (!authUserId) return;
    try {
      await updateAddress(address.id, authUserId, {
        label: address.label,
        street: address.street,
        city: address.city,
        country: address.country,
        zipCode: address.zipCode,
        isDefault: true,
      });
      toast.success('Default address updated');
      fetchAddresses();
    } catch {
      toast.error('Failed to set default address');
    }
  };

  return (
    <div className="space-y-8 font-sans">
      <div className="flex justify-between items-center border-b border-border/40 pb-5">
        <div>
          <h1 className="font-serif text-2xl text-charcoal tracking-wide">
            Saved Addresses
          </h1>
          <p className="text-xs text-brown-muted mt-1">
            Manage your billing and shipping locations.
          </p>
        </div>
        {!isAddingNew && !editingAddress && (
          <Button
            onClick={() => setIsAddingNew(true)}
            className="bg-accent text-background hover:bg-accent/90 text-xs font-semibold px-4 py-2 rounded-md flex items-center gap-1.5"
          >
            <Plus className="h-4 w-4" />
            Add Address
          </Button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-accent" />
        </div>
      ) : isAddingNew ? (
        <div className="border border-border/60 rounded-md p-6 bg-beige/5">
          <h3 className="font-serif text-base font-semibold text-charcoal mb-4">
            Add New Address
          </h3>
          <AddressForm
            onSubmit={handleCreateAddress}
            onCancel={() => setIsAddingNew(false)}
            submitLabel="Save Address"
          />
        </div>
      ) : editingAddress ? (
        <div className="border border-border/60 rounded-md p-6 bg-beige/5">
          <h3 className="font-serif text-base font-semibold text-charcoal mb-4">
            Edit Address: {editingAddress.label}
          </h3>
          <AddressForm
            initialValues={{
              label: editingAddress.label,
              street: editingAddress.street,
              city: editingAddress.city,
              country: editingAddress.country,
              zipCode: editingAddress.zipCode,
              isDefault: editingAddress.isDefault,
            }}
            onSubmit={handleUpdateAddress}
            onCancel={() => setEditingAddress(null)}
            submitLabel="Update Address"
          />
        </div>
      ) : addresses.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-border/50 rounded-md bg-beige/10">
          <p className="text-xs text-brown-muted mb-4">
            You do not have any saved addresses.
          </p>
          <Button
            onClick={() => setIsAddingNew(true)}
            className="bg-accent text-background hover:bg-accent/90 text-xs font-semibold px-6 py-2.5 rounded-md"
          >
            Create Your First Address
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {addresses.map((address) => (
            <div
              key={address.id}
              className={`rounded-md border p-5 flex flex-col justify-between space-y-4 bg-background transition-all duration-200 ${
                address.isDefault ? 'border-accent bg-accent/[0.02]' : 'border-border/60'
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-2 border-b border-border/40 pb-3">
                  <span className="text-xs font-bold text-charcoal uppercase tracking-wider">
                    {address.label}
                  </span>
                  {address.isDefault ? (
                    <span className="inline-flex items-center gap-1 text-[9px] bg-accent text-background px-2 py-0.5 rounded-full font-bold">
                      <Check className="h-2.5 w-2.5" />
                      Default
                    </span>
                  ) : (
                    <button
                      onClick={() => handleSetDefaultAddress(address)}
                      className="text-[10px] text-accent hover:underline font-semibold"
                    >
                      Set as Default
                    </button>
                  )}
                </div>
                <p className="mt-3 text-xs text-brown-muted leading-relaxed">
                  {address.street} <br />
                  {address.city}, {address.zipCode} <br />
                  {address.country}
                </p>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-border/40">
                <button
                  onClick={() => setEditingAddress(address)}
                  className="text-[11px] text-brown-muted hover:text-charcoal font-semibold"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDeleteAddress(address.id)}
                  className="text-[11px] text-error hover:underline flex items-center gap-1 font-semibold"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
