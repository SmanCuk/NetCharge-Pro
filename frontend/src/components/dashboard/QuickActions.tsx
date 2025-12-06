'use client';

import React from 'react';
import { Card } from '../ui/Card';
import { Plus, FileText, Users, DollarSign, Download } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function QuickActions() {
  const router = useRouter();

  const actions = [
    {
      icon: <Users className="w-5 h-5" />,
      label: 'Add Customer',
      description: 'Create new customer',
      color: 'bg-blue-500 hover:bg-blue-600',
      onClick: () => router.push('/dashboard/customers'),
    },
    {
      icon: <FileText className="w-5 h-5" />,
      label: 'New Invoice',
      description: 'Generate invoice',
      color: 'bg-purple-500 hover:bg-purple-600',
      onClick: () => router.push('/dashboard/invoices'),
    },
    {
      icon: <DollarSign className="w-5 h-5" />,
      label: 'Record Payment',
      description: 'Add payment',
      color: 'bg-green-500 hover:bg-green-600',
      onClick: () => router.push('/dashboard/payments'),
    },
    {
      icon: <Download className="w-5 h-5" />,
      label: 'Export Report',
      description: 'Download data',
      color: 'bg-orange-500 hover:bg-orange-600',
      onClick: () => alert('Export feature coming soon!'),
    },
  ];

  return (
    <Card>
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
      
      <div className="grid grid-cols-2 gap-3">
        {actions.map((action, index) => (
          <button
            key={index}
            onClick={action.onClick}
            className={`${action.color} text-white p-4 rounded-lg shadow-md transition-all hover:shadow-lg hover:scale-105 active:scale-95`}
          >
            <div className="flex flex-col items-center text-center gap-2">
              <div className="p-2 bg-white bg-opacity-20 rounded-full">
                {action.icon}
              </div>
              <div>
                <p className="font-medium text-sm">{action.label}</p>
                <p className="text-xs opacity-90">{action.description}</p>
              </div>
            </div>
          </button>
        ))}
      </div>
    </Card>
  );
}
