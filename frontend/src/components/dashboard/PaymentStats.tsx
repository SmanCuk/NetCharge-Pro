'use client';

import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { Card } from '../ui/Card';

interface PaymentMethodData {
  method: string;
  count: number;
  total: number;
}

interface PaymentStatsProps {
  data: {
    total: number;
    recent: number;
    byMethod: PaymentMethodData[];
  };
}

const COLORS = ['#2563eb', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

const METHOD_LABELS: Record<string, string> = {
  cash: 'Cash',
  transfer: 'Bank Transfer',
  qris: 'QRIS',
  credit_card: 'Credit Card',
  debit_card: 'Debit Card',
};

export default function PaymentStats({ data }: PaymentStatsProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(value);
  };

  const chartData = data.byMethod.map(m => ({
    name: METHOD_LABELS[m.method] || m.method,
    value: m.count,
    amount: m.total,
  }));

  return (
    <Card>
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Payment Statistics</h3>
        <div className="flex gap-6 mt-2">
          <p className="text-sm text-gray-500">
            Total Payments: <span className="font-bold text-primary-600">{data.total}</span>
          </p>
          <p className="text-sm text-gray-500">
            Last 30 Days: <span className="font-bold text-green-600">{data.recent}</span>
          </p>
        </div>
      </div>
      
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
        
        <div className="space-y-3">
          <h4 className="font-medium text-gray-700 text-sm">Payment Methods</h4>
          {data.byMethod.map((method, index) => (
            <div key={method.method} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div 
                  className="w-4 h-4 rounded-full" 
                  style={{ backgroundColor: COLORS[index % COLORS.length] }}
                />
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {METHOD_LABELS[method.method] || method.method}
                  </p>
                  <p className="text-xs text-gray-500">{method.count} transactions</p>
                </div>
              </div>
              <p className="text-sm font-semibold text-gray-900">
                {formatCurrency(method.total)}
              </p>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}
