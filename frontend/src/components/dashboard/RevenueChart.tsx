'use client';

import React, { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card } from '../ui/Card';

interface RevenueData {
  date: string;
  revenue: number;
}

interface RevenueChartProps {
  data: RevenueData[];
  total: number;
  period: string;
  compareData?: RevenueData[];
  compareTotal?: number;
  compareMode?: boolean;
}

export default function RevenueChart({ data, total, period, compareData, compareTotal, compareMode }: RevenueChartProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(value);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    if (period === '12months') {
      return date.toLocaleDateString('id-ID', { month: 'short', year: 'numeric' });
    }
    return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
  };

  // Merge current and compare data for dual line chart
  const mergedData = useMemo(() => {
    if (!compareMode || !compareData) return data.map(d => ({ ...d, currentRevenue: d.revenue }));

    // Create a map of compare data
    const compareMap = new Map(compareData.map((d, i) => [i, d.revenue]));

    return data.map((d, i) => ({
      date: d.date,
      currentRevenue: d.revenue,
      compareRevenue: compareMap.get(i) || 0,
    }));
  }, [data, compareData, compareMode]);

  const percentChange = compareTotal ? ((total - compareTotal) / compareTotal) * 100 : 0;

  return (
    <Card>
      <div className="mb-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Revenue Trend</h3>
            <p className="text-sm text-gray-500 mt-1">
              Current: <span className="font-bold text-primary-600">{formatCurrency(total)}</span>
              {compareMode && compareTotal && (
                <>
                  {' | '}
                  <span className="text-purple-500">
                    Compare: <span className="font-bold">{formatCurrency(compareTotal)}</span>
                  </span>
                  {' '}
                  <span className={`text-xs font-semibold ${percentChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    ({percentChange >= 0 ? '+' : ''}{percentChange.toFixed(1)}%)
                  </span>
                </>
              )}
            </p>
          </div>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={mergedData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="date" 
            tickFormatter={formatDate}
            style={{ fontSize: '12px' }}
          />
          <YAxis 
            tickFormatter={(value) => `${(value / 1000000).toFixed(0)}M`}
            style={{ fontSize: '12px' }}
          />
          <Tooltip 
            formatter={(value: number) => formatCurrency(value)}
            labelFormatter={formatDate}
          />
          <Legend />
          <Line 
            type="monotone" 
            dataKey="currentRevenue" 
            stroke="#2563eb" 
            strokeWidth={2}
            dot={{ fill: '#2563eb', r: 4 }}
            activeDot={{ r: 6 }}
            name="Current Period"
          />
          {compareMode && (
            <Line 
              type="monotone" 
              dataKey="compareRevenue" 
              stroke="#9333ea" 
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={{ fill: '#9333ea', r: 4 }}
              activeDot={{ r: 6 }}
              name="Compare Period"
            />
          )}
        </LineChart>
      </ResponsiveContainer>
    </Card>
  );
}
