'use client';

import React from 'react';
import { Card } from '../ui/Card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface StatusData {
  customers: Array<{ status: string; count: number }>;
  invoices: Array<{ status: string; count: number; total: number }>;
}

interface StatusDistributionProps {
  data: StatusData;
}

const COLORS = {
  active: '#10b981',
  inactive: '#6b7280',
  suspended: '#ef4444',
  pending: '#f59e0b',
  paid: '#10b981',
  overdue: '#ef4444',
  cancelled: '#6b7280',
};

const STATUS_LABELS: Record<string, string> = {
  active: 'Active',
  inactive: 'Inactive',
  suspended: 'Suspended',
  pending: 'Pending',
  paid: 'Paid',
  overdue: 'Overdue',
  cancelled: 'Cancelled',
};

export default function StatusDistribution({ data }: StatusDistributionProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const customerChartData = data.customers.map(c => ({
    name: STATUS_LABELS[c.status] || c.status,
    value: c.count,
    status: c.status,
  }));

  const invoiceChartData = data.invoices.map(i => ({
    name: STATUS_LABELS[i.status] || i.status,
    count: i.count,
    amount: i.total,
    status: i.status,
  }));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Customer Status Distribution */}
      <Card>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Customer Status Distribution</h3>
        <div className="flex items-center gap-4">
          <ResponsiveContainer width="50%" height={200}>
            <PieChart>
              <Pie
                data={customerChartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {customerChartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[entry.status as keyof typeof COLORS]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          
          <div className="flex-1 space-y-2">
            {customerChartData.map((item, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: COLORS[item.status as keyof typeof COLORS] }}
                  />
                  <span className="text-sm text-gray-700">{item.name}</span>
                </div>
                <span className="text-sm font-semibold text-gray-900">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* Invoice Status Distribution */}
      <Card>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Invoice Status Distribution</h3>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={invoiceChartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" style={{ fontSize: '12px' }} />
            <YAxis style={{ fontSize: '12px' }} />
            <Tooltip 
              formatter={(value: number, name: string) => {
                if (name === 'amount') return formatCurrency(value);
                return value;
              }}
            />
            <Legend />
            <Bar dataKey="count" fill="#3b82f6" name="Count" />
          </BarChart>
        </ResponsiveContainer>
        
        <div className="mt-4 space-y-2">
          {invoiceChartData.map((item, index) => (
            <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
              <div className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: COLORS[item.status as keyof typeof COLORS] }}
                />
                <span className="text-sm text-gray-700">{item.name}</span>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-gray-900">{formatCurrency(item.amount)}</p>
                <p className="text-xs text-gray-500">{item.count} invoice{item.count !== 1 ? 's' : ''}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
