'use client';

import { useEffect, useState } from 'react';
import { Users, FileText, CreditCard, AlertTriangle } from 'lucide-react';
import { StatCard, Card } from '@/components/ui/Card';
import { Badge, getStatusBadgeVariant } from '@/components/ui/Badge';
import { invoiceService, customerService, paymentService } from '@/services';
import type { DashboardStats, Invoice, Customer } from '@/types';
import { format } from 'date-fns';

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentInvoices, setRecentInvoices] = useState<Invoice[]>([]);
  const [activeCustomers, setActiveCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsData, invoicesData, customersData] = await Promise.all([
          invoiceService.getDashboardStats(),
          invoiceService.getAll(),
          customerService.getAll('active'),
        ]);
        setStats(statsData);
        setRecentInvoices(invoicesData.slice(0, 5));
        setActiveCustomers(customersData);
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500">Overview of your WiFi billing system</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Active Customers"
          value={activeCustomers.length}
          icon={<Users size={24} />}
        />
        <StatCard
          title="Pending Invoices"
          value={formatCurrency(stats?.totalPending || 0)}
          icon={<FileText size={24} />}
        />
        <StatCard
          title="Overdue Amount"
          value={formatCurrency(stats?.totalOverdue || 0)}
          icon={<AlertTriangle size={24} />}
        />
        <StatCard
          title="Revenue This Month"
          value={formatCurrency(stats?.totalRevenueThisMonth || 0)}
          icon={<CreditCard size={24} />}
        />
      </div>

      {/* Recent Invoices */}
      <Card title="Recent Invoices">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-sm text-gray-500 border-b">
                <th className="pb-3 font-medium">Invoice #</th>
                <th className="pb-3 font-medium">Customer</th>
                <th className="pb-3 font-medium">Amount</th>
                <th className="pb-3 font-medium">Due Date</th>
                <th className="pb-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {recentInvoices.length > 0 ? (
                recentInvoices.map((invoice) => (
                  <tr key={invoice.id} className="text-sm">
                    <td className="py-3 font-medium">{invoice.invoiceNumber}</td>
                    <td className="py-3">{invoice.customer?.name || 'N/A'}</td>
                    <td className="py-3">{formatCurrency(Number(invoice.amount))}</td>
                    <td className="py-3">
                      {format(new Date(invoice.dueDate), 'MMM dd, yyyy')}
                    </td>
                    <td className="py-3">
                      <Badge variant={getStatusBadgeVariant(invoice.status)}>
                        {invoice.status}
                      </Badge>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-gray-500">
                    No invoices found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Active Customers */}
      <Card title="Active Customers">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-sm text-gray-500 border-b">
                <th className="pb-3 font-medium">Name</th>
                <th className="pb-3 font-medium">Package</th>
                <th className="pb-3 font-medium">Monthly Rate</th>
                <th className="pb-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {activeCustomers.length > 0 ? (
                activeCustomers.slice(0, 5).map((customer) => (
                  <tr key={customer.id} className="text-sm">
                    <td className="py-3">
                      <div>
                        <p className="font-medium">{customer.name}</p>
                        <p className="text-gray-500 text-xs">{customer.email}</p>
                      </div>
                    </td>
                    <td className="py-3 capitalize">{customer.packageType}</td>
                    <td className="py-3">{formatCurrency(Number(customer.monthlyRate))}</td>
                    <td className="py-3">
                      <Badge variant={getStatusBadgeVariant(customer.status)}>
                        {customer.status}
                      </Badge>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-gray-500">
                    No active customers
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
