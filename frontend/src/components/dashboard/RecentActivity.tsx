'use client';

import React from 'react';
import { Card } from '../ui/Card';
import { Clock, TrendingUp, TrendingDown, FileText, CreditCard } from 'lucide-react';
import { Badge } from '../ui/Badge';
import { formatDistanceToNow } from 'date-fns';

interface Activity {
  id: string;
  type: 'payment' | 'invoice';
  title: string;
  amount: number;
  date: Date | string;
  status: string;
  customerName?: string;
}

interface RecentActivityProps {
  activities: Activity[];
}

export default function RecentActivity({ activities }: RecentActivityProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(value);
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      completed: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800',
      paid: 'bg-green-100 text-green-800',
      overdue: 'bg-red-100 text-red-800',
      cancelled: 'bg-gray-100 text-gray-800',
      failed: 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getActivityIcon = (type: string) => {
    return type === 'payment' ? (
      <div className="p-2 bg-green-100 rounded-full">
        <CreditCard className="w-4 h-4 text-green-600" />
      </div>
    ) : (
      <div className="p-2 bg-blue-100 rounded-full">
        <FileText className="w-4 h-4 text-blue-600" />
      </div>
    );
  };

  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Recent Activities</h3>
        <Clock className="w-5 h-5 text-gray-400" />
      </div>
      
      <div className="space-y-4 max-h-96 overflow-y-auto">
        {activities.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-8">No recent activities</p>
        ) : (
          activities.map((activity) => (
            <div
              key={activity.id}
              className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
            >
              {getActivityIcon(activity.type)}
              
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {activity.title}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-gray-500">
                    {formatDistanceToNow(new Date(activity.date), { addSuffix: true })}
                  </span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${getStatusColor(activity.status)}`}>
                    {activity.status}
                  </span>
                </div>
              </div>
              
              <div className="flex flex-col items-end">
                <p className="text-sm font-semibold text-gray-900">
                  {formatCurrency(activity.amount)}
                </p>
                {activity.type === 'payment' && (
                  <TrendingUp className="w-4 h-4 text-green-500 mt-1" />
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </Card>
  );
}
