'use client';

import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card } from '../ui/Card';

interface CustomerGrowthData {
  date: string;
  new: number;
  total: number;
}

interface CustomerGrowthChartProps {
  data: CustomerGrowthData[];
  totalNew: number;
  period: string;
}

export default function CustomerGrowthChart({ data, totalNew, period }: CustomerGrowthChartProps) {
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    if (period === '12months') {
      return date.toLocaleDateString('id-ID', { month: 'short', year: 'numeric' });
    }
    return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
  };

  return (
    <Card>
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Customer Growth</h3>
        <p className="text-sm text-gray-500 mt-1">
          New Customers: <span className="font-bold text-green-600">{totalNew}</span>
        </p>
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="date" 
            tickFormatter={formatDate}
            style={{ fontSize: '12px' }}
          />
          <YAxis style={{ fontSize: '12px' }} />
          <Tooltip 
            labelFormatter={formatDate}
          />
          <Legend />
          <Area 
            type="monotone" 
            dataKey="new" 
            stackId="1"
            stroke="#10b981" 
            fill="#10b981"
            fillOpacity={0.6}
            name="New Customers"
          />
          <Area 
            type="monotone" 
            dataKey="total" 
            stackId="2"
            stroke="#3b82f6" 
            fill="#3b82f6"
            fillOpacity={0.3}
            name="Total Customers"
          />
        </AreaChart>
      </ResponsiveContainer>
    </Card>
  );
}
