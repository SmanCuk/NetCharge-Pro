'use client';

import React from 'react';
import { Card } from '../ui/Card';
import { Trophy, User, Mail } from 'lucide-react';

interface TopCustomer {
  customerId: string;
  customerName: string;
  customerEmail: string;
  totalRevenue: number;
  invoiceCount: number;
}

interface TopCustomersProps {
  customers: TopCustomer[];
}

export default function TopCustomers({ customers }: TopCustomersProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(value);
  };

  const getMedalColor = (index: number) => {
    const colors = [
      'bg-gradient-to-br from-yellow-400 to-yellow-600',
      'bg-gradient-to-br from-gray-300 to-gray-500',
      'bg-gradient-to-br from-orange-400 to-orange-600',
    ];
    return colors[index] || 'bg-gradient-to-br from-blue-400 to-blue-600';
  };

  return (
    <Card>
      <div className="flex items-center gap-2 mb-4">
        <Trophy className="w-5 h-5 text-yellow-500" />
        <h3 className="text-lg font-semibold text-gray-900">Top Customers</h3>
      </div>
      
      <div className="space-y-3">
        {customers.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-8">No customer data available</p>
        ) : (
          customers.map((customer, index) => (
            <div
              key={customer.customerId}
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-all hover:shadow-md cursor-pointer"
            >
              {/* Rank Badge */}
              <div className={`flex-shrink-0 w-10 h-10 rounded-full ${getMedalColor(index)} flex items-center justify-center text-white font-bold shadow-lg`}>
                {index + 1}
              </div>
              
              {/* Customer Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-gray-400" />
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {customer.customerName}
                  </p>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <Mail className="w-3 h-3 text-gray-400" />
                  <p className="text-xs text-gray-500 truncate">
                    {customer.customerEmail}
                  </p>
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  {customer.invoiceCount} invoice{customer.invoiceCount !== 1 ? 's' : ''}
                </p>
              </div>
              
              {/* Revenue */}
              <div className="text-right">
                <p className="text-sm font-bold text-primary-600">
                  {formatCurrency(customer.totalRevenue)}
                </p>
                <p className="text-xs text-gray-500">total revenue</p>
              </div>
            </div>
          ))
        )}
      </div>
    </Card>
  );
}
