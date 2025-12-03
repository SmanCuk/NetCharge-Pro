'use client';

import React from 'react';
import { Users, FileText, DollarSign, TrendingUp } from 'lucide-react';

interface SummaryCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  color: string;
}

function SummaryCard({ title, value, subtitle, icon, color }: SummaryCardProps) {
  return (
    <div className="bg-white rounded-xl shadow-md p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500 mb-1">{title}</p>
          <p className={`text-2xl font-bold ${color}`}>{value}</p>
          {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
        </div>
        <div className={`p-3 rounded-full ${color.replace('text', 'bg').replace('600', '100')}`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

interface DashboardSummaryProps {
  data: {
    customers: {
      total: number;
      active: number;
      inactive: number;
    };
    invoices: {
      total: number;
      paid: number;
      pending: number;
    };
    revenue: {
      total: number;
      thisMonth: number;
    };
  };
}

export default function DashboardSummary({ data }: DashboardSummaryProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <SummaryCard
        title="Total Customers"
        value={data.customers.total}
        subtitle={`${data.customers.active} active`}
        icon={<Users className="w-6 h-6 text-blue-600" />}
        color="text-blue-600"
      />
      <SummaryCard
        title="Total Invoices"
        value={data.invoices.total}
        subtitle={`${data.invoices.pending} pending`}
        icon={<FileText className="w-6 h-6 text-purple-600" />}
        color="text-purple-600"
      />
      <SummaryCard
        title="Total Revenue"
        value={formatCurrency(data.revenue.total)}
        subtitle="All time"
        icon={<DollarSign className="w-6 h-6 text-green-600" />}
        color="text-green-600"
      />
      <SummaryCard
        title="This Month"
        value={formatCurrency(data.revenue.thisMonth)}
        subtitle="Current month revenue"
        icon={<TrendingUp className="w-6 h-6 text-orange-600" />}
        color="text-orange-600"
      />
    </div>
  );
}
