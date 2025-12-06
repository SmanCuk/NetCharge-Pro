'use client';

import React, { useMemo } from 'react';
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
  compareData?: CustomerGrowthData[];
  compareTotalNew?: number;
  compareMode?: boolean;
}

export default function CustomerGrowthChart({ 
  data, 
  totalNew, 
  period, 
  compareData, 
  compareTotalNew, 
  compareMode 
}: CustomerGrowthChartProps) {
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    if (period === '12months') {
      return date.toLocaleDateString('id-ID', { month: 'short', year: 'numeric' });
    }
    return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
  };

  // Merge current and compare data
  const mergedData = useMemo(() => {
    if (!compareMode || !compareData) {
      return data.map(d => ({ ...d, currentNew: d.new, currentTotal: d.total }));
    }

    const compareMap = new Map(compareData.map((d, i) => [i, { new: d.new, total: d.total }]));

    return data.map((d, i) => {
      const compare = compareMap.get(i);
      return {
        date: d.date,
        currentNew: d.new,
        currentTotal: d.total,
        compareNew: compare?.new || 0,
        compareTotal: compare?.total || 0,
      };
    });
  }, [data, compareData, compareMode]);

  const percentChange = compareTotalNew ? ((totalNew - compareTotalNew) / compareTotalNew) * 100 : 0;

  return (
    <Card>
      <div className="mb-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Customer Growth</h3>
            <p className="text-sm text-gray-500 mt-1">
              Current: <span className="font-bold text-green-600">{totalNew} new</span>
              {compareMode && compareTotalNew !== undefined && (
                <>
                  {' | '}
                  <span className="text-purple-500">
                    Compare: <span className="font-bold">{compareTotalNew} new</span>
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
        <AreaChart data={mergedData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
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
            dataKey="currentNew" 
            stackId="1"
            stroke="#10b981" 
            fill="#10b981"
            fillOpacity={0.6}
            name="Current New"
          />
          {compareMode && (
            <Area 
              type="monotone" 
              dataKey="compareNew" 
              stackId="1"
              stroke="#9333ea" 
              fill="#9333ea"
              fillOpacity={0.4}
              strokeDasharray="5 5"
              name="Compare New"
            />
          )}
        </AreaChart>
      </ResponsiveContainer>
    </Card>
  );
}
