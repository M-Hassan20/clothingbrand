'use client';

import React, { useState } from 'react';
import { Plus, Check, PlusCircle } from 'lucide-react';
import { AddressResponse, AddressCreateRequest } from '@/types/api';
import AddressForm from './AddressForm';

interface AddressSelectorProps {
  addresses: AddressResponse[];
  selectedAddressId: number | null;
  onSelectAddress: (id: number) => void;
  onCreateNewAddress: (values: AddressCreateRequest) => Promise<void>;
}

export default function AddressSelector({
  addresses,
  selectedAddressId,
  onSelectAddress,
  onCreateNewAddress,
}: AddressSelectorProps) {
  const [isAddingNew, setIsAddingNew] = useState(false);

  const handleCreateAddress = async (values: AddressCreateRequest) => {
    await onCreateNewAddress(values);
    setIsAddingNew(false);
  };

  return (
    <div className="space-y-6">
      {isAddingNew ? (
        <div className="border border-border/60 rounded-md p-6 bg-beige/5">
          <h3 className="font-serif text-base font-semibold text-charcoal mb-4">
            Add New Delivery Address
          </h3>
          <AddressForm
            onSubmit={handleCreateAddress}
            onCancel={() => setIsAddingNew(false)}
            submitLabel="Save & Select"
          />
        </div>
      ) : (
        <div className="space-y-4">
          <h3 className="font-serif text-sm font-semibold uppercase tracking-wider text-charcoal mb-2">
            Select Shipping Address
          </h3>

          {addresses.length === 0 ? (
            <div className="text-center py-10 border border-dashed border-border/50 rounded-md bg-beige/10">
              <p className="font-sans text-xs text-brown-muted mb-4">
                You do not have any saved delivery addresses yet.
              </p>
              <button
                onClick={() => setIsAddingNew(true)}
                className="font-sans text-xs text-accent hover:underline font-semibold flex items-center gap-1.5 mx-auto"
              >
                <PlusCircle className="h-4 w-4" />
                Add Your First Address
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Existing address list cards */}
              {addresses.map((address) => {
                const isSelected = selectedAddressId === address.id;
                return (
                  <div
                    key={address.id}
                    onClick={() => onSelectAddress(address.id)}
                    className={`relative cursor-pointer rounded-md border p-4 flex flex-col justify-between transition-all duration-200 ${
                      isSelected
                        ? 'border-accent bg-accent/5 ring-1 ring-accent'
                        : 'border-border hover:border-charcoal/40 bg-background'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-sans text-xs font-bold text-charcoal capitalize">
                          {address.label}
                        </span>
                        {address.isDefault && (
                          <span className="font-sans text-[9px] bg-blush/40 text-charcoal px-2 py-0.5 rounded-full font-medium">
                            Default
                          </span>
                        )}
                      </div>
                      <p className="mt-2 font-sans text-xs text-brown-muted leading-relaxed">
                        {address.street} <br />
                        {address.city}, {address.zipCode} <br />
                        {address.country}
                      </p>
                    </div>

                    {isSelected && (
                      <span className="absolute bottom-3 right-3 flex h-5 w-5 items-center justify-center rounded-full bg-accent text-background">
                        <Check className="h-3.5 w-3.5 text-background" />
                      </span>
                    )}
                  </div>
                );
              })}

              {/* Add New Trigger Card */}
              <div
                onClick={() => setIsAddingNew(true)}
                className="border border-dashed border-border/80 hover:border-charcoal/40 bg-beige/5 rounded-md p-4 flex items-center justify-center text-center cursor-pointer transition-colors duration-200 min-h-[120px]"
              >
                <button className="font-sans text-xs text-brown-muted hover:text-charcoal font-semibold flex flex-col items-center gap-1.5">
                  <Plus className="h-5 w-5 text-accent" />
                  Add New Address
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
