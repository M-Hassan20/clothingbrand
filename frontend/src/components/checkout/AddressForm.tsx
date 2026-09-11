'use client';

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { AddressCreateRequest } from '@/types/api';

const isPakistan = (val: string) => {
  if (!val) return false;
  const c = val.trim().toLowerCase();
  return c === 'pakistan' || c === 'pk' || c === 'paakistan' || c.includes('pakistan');
};

const addressSchema = z.object({
  label: z.string().min(1, 'Label is required (e.g., Home, Office)'),
  street: z.string().min(1, 'Street address is required'),
  city: z.string().min(1, 'City is required'),
  country: z
    .string()
    .min(1, 'Country is required')
    .refine((val) => isPakistan(val), {
      message: 'We currently deliver within Pakistan only.',
    }),
  zipCode: z.string().min(1, 'Zip/Postal code is required'),
  isDefault: z.boolean(),
});

type FormData = z.infer<typeof addressSchema>;

interface AddressFormProps {
  initialValues?: FormData;
  onSubmit: (values: AddressCreateRequest) => Promise<void>;
  onCancel?: () => void;
  submitLabel?: string;
}

export default function AddressForm({
  initialValues,
  onSubmit,
  onCancel,
  submitLabel = 'Save Address',
}: AddressFormProps) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(addressSchema),
    defaultValues: initialValues || {
      label: '',
      street: '',
      city: '',
      country: 'Pakistan',
      zipCode: '',
      isDefault: false,
    },
  });

  const isDefaultChecked = watch('isDefault');

  const onFormSubmit = async (data: FormData) => {
    await onSubmit(data);
  };

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4 font-sans">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Label */}
        <div>
          <label className="block text-xs font-semibold text-brown-muted uppercase tracking-wider mb-1.5">
            Address Label
          </label>
          <Input
            type="text"
            placeholder="e.g. Home, Work"
            {...register('label')}
            className={errors.label ? 'border-error' : 'border-border'}
          />
          {errors.label && (
            <p className="text-[10px] text-error mt-1">{errors.label.message}</p>
          )}
        </div>

        {/* Street */}
        <div className="sm:col-span-2">
          <label className="block text-xs font-semibold text-brown-muted uppercase tracking-wider mb-1.5">
            Street Address
          </label>
          <Input
            type="text"
            placeholder="Apartment, suite, unit, street name"
            {...register('street')}
            className={errors.street ? 'border-error' : 'border-border'}
          />
          {errors.street && (
            <p className="text-[10px] text-error mt-1">{errors.street.message}</p>
          )}
        </div>

        {/* City */}
        <div>
          <label className="block text-xs font-semibold text-brown-muted uppercase tracking-wider mb-1.5">
            City
          </label>
          <Input
            type="text"
            placeholder="City"
            {...register('city')}
            className={errors.city ? 'border-error' : 'border-border'}
          />
          {errors.city && (
            <p className="text-[10px] text-error mt-1">{errors.city.message}</p>
          )}
        </div>

        {/* Zip Code */}
        <div>
          <label className="block text-xs font-semibold text-brown-muted uppercase tracking-wider mb-1.5">
            Zip / Postal Code
          </label>
          <Input
            type="text"
            placeholder="Zip Code"
            {...register('zipCode')}
            className={errors.zipCode ? 'border-error' : 'border-border'}
          />
          {errors.zipCode && (
            <p className="text-[10px] text-error mt-1">{errors.zipCode.message}</p>
          )}
        </div>

        {/* Country */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-xs font-semibold text-brown-muted uppercase tracking-wider">
              Country
            </label>
            <span className="text-[10px] text-amber-700 font-semibold">Pakistan Only</span>
          </div>
          <Input
            type="text"
            placeholder="Pakistan"
            {...register('country')}
            className={errors.country ? 'border-error' : 'border-border'}
          />
          {errors.country ? (
            <p className="text-[10px] text-error mt-1">{errors.country.message}</p>
          ) : (
            <p className="text-[10px] text-brown-muted mt-1">Delivery is currently supported within Pakistan only.</p>
          )}
        </div>
      </div>

      {/* Default Checkbox */}
      <div className="flex items-center space-x-2 pt-2">
        <Checkbox
          id="isDefault"
          checked={isDefaultChecked}
          onCheckedChange={(checked) => setValue('isDefault', !!checked)}
        />
        <label
          htmlFor="isDefault"
          className="text-xs text-brown-muted select-none cursor-pointer"
        >
          Set as default delivery address
        </label>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-4 border-t border-border/40">
        {onCancel && (
          <Button
            type="button"
            variant="ghost"
            onClick={onCancel}
            disabled={isSubmitting}
            className="text-brown-muted hover:text-charcoal hover:bg-beige/20 text-xs font-semibold px-4 py-2"
          >
            Cancel
          </Button>
        )}
        <Button
          type="submit"
          disabled={isSubmitting}
          className="bg-accent text-background hover:bg-accent/90 text-xs font-semibold px-6 py-2 rounded-md"
        >
          {isSubmitting ? 'Saving...' : submitLabel}
        </Button>
      </div>
    </form>
  );
}
