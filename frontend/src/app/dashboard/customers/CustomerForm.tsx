'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { customerService } from '@/services';
import type { Customer } from '@/types';

const customerSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email'),
  phone: z.string().min(1, 'Phone is required'),
  address: z.string().optional(),
  packageType: z.enum(['basic', 'standard', 'premium']),
  monthlyRate: z.number().min(0, 'Monthly rate must be positive'),
  status: z.enum(['active', 'inactive', 'suspended']),
  macAddress: z.string().optional(),
  ipAddress: z.string().optional(),
  billingDay: z.number().min(1).max(28),
});

type CustomerFormData = z.infer<typeof customerSchema>;

interface CustomerFormProps {
  customer: Customer | null;
  onSubmit: () => void;
  onCancel: () => void;
}

export default function CustomerForm({ customer, onSubmit, onCancel }: CustomerFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CustomerFormData>({
    resolver: zodResolver(customerSchema),
    defaultValues: customer
      ? {
          ...customer,
          monthlyRate: Number(customer.monthlyRate),
        }
      : {
          packageType: 'basic',
          status: 'active',
          monthlyRate: 150000,
          billingDay: 1,
        },
  });

  const handleFormSubmit = async (data: CustomerFormData) => {
    setLoading(true);
    setError('');

    try {
      if (customer) {
        await customerService.update(customer.id, data);
      } else {
        await customerService.create(data);
      }
      onSubmit();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save customer');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="Name"
          {...register('name')}
          error={errors.name?.message}
        />
        <Input
          label="Email"
          type="email"
          {...register('email')}
          error={errors.email?.message}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="Phone"
          {...register('phone')}
          error={errors.phone?.message}
        />
        <Input
          label="Address"
          {...register('address')}
          error={errors.address?.message}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Select
          label="Package Type"
          {...register('packageType')}
          options={[
            { value: 'basic', label: 'Basic' },
            { value: 'standard', label: 'Standard' },
            { value: 'premium', label: 'Premium' },
          ]}
          error={errors.packageType?.message}
        />
        <Input
          label="Monthly Rate (IDR)"
          type="number"
          {...register('monthlyRate', { valueAsNumber: true })}
          error={errors.monthlyRate?.message}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Select
          label="Status"
          {...register('status')}
          options={[
            { value: 'active', label: 'Active' },
            { value: 'inactive', label: 'Inactive' },
            { value: 'suspended', label: 'Suspended' },
          ]}
          error={errors.status?.message}
        />
        <Input
          label="Billing Day (1-28)"
          type="number"
          {...register('billingDay', { valueAsNumber: true })}
          error={errors.billingDay?.message}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="MAC Address"
          placeholder="AA:BB:CC:DD:EE:FF"
          {...register('macAddress')}
          error={errors.macAddress?.message}
        />
        <Input
          label="IP Address"
          placeholder="192.168.1.100"
          {...register('ipAddress')}
          error={errors.ipAddress?.message}
        />
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" loading={loading}>
          {customer ? 'Update' : 'Create'} Customer
        </Button>
      </div>
    </form>
  );
}
