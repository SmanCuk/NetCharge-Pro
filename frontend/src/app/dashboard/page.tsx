'use client';

import { useEffect, useState } from 'react';
import { Users, FileText, CreditCard, AlertTriangle } from 'lucide-react';
import { StatCard, Card } from '@/components/ui/Card';
import { Badge, getStatusBadgeVariant } from '@/components/ui/Badge';
import { Select } from '@/components/ui/Select';
import { invoiceService, customerService, analyticsService } from '@/services';
import type { DashboardStats, Invoice, Customer } from '@/types';
import { format } from 'date-fns';
import DashboardSummary from '@/components/dashboard/DashboardSummary';
import RevenueChart from '@/components/dashboard/RevenueChart';
import CustomerGrowthChart from '@/components/dashboard/CustomerGrowthChart';
import PaymentStats from '@/components/dashboard/PaymentStats';
import TopCustomers from '@/components/dashboard/TopCustomers';
import RecentActivity from '@/components/dashboard/RecentActivity';
import QuickActions from '@/components/dashboard/QuickActions';
import StatusDistribution from '@/components/dashboard/StatusDistribution';

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentInvoices, setRecentInvoices] = useState<Invoice[]>([]);
  const [activeCustomers, setActiveCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Analytics state
  const [summary, setSummary] = useState<any>(null);
  const [revenueData, setRevenueData] = useState<any>(null);
  const [customerGrowthData, setCustomerGrowthData] = useState<any>(null);
  const [paymentStatsData, setPaymentStatsData] = useState<any>(null);
  const [topCustomers, setTopCustomers] = useState<any[]>([]);
  const [recentActivities, setRecentActivities] = useState<any[]>([]);
  const [statusDistribution, setStatusDistribution] = useState<any>(null);
  const [period, setPeriod] = useState<'7days' | '30days' | '12months'>('30days');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [
          statsData, 
          invoicesData, 
          customersData,
          summaryData,
          revenueRes,
          customerGrowthRes,
          paymentStatsRes,
          topCustomersRes,
          recentActivitiesRes,
          statusDistributionRes,
        ] = await Promise.all([
          invoiceService.getDashboardStats(),
          invoiceService.getAll(),
          customerService.getAll('active'),
          analyticsService.getSummary(),
          analyticsService.getRevenue(period),
          analyticsService.getCustomerGrowth(period),
          analyticsService.getPaymentStats(),
          analyticsService.getTopCustomers(5),
          analyticsService.getRecentActivities(10),
          analyticsService.getStatusDistribution(),
        ]);
        setStats(statsData);
        setRecentInvoices(invoicesData.slice(0, 5));
        setActiveCustomers(customersData);
        setSummary(summaryData);
        setRevenueData(revenueRes);
        setCustomerGrowthData(customerGrowthRes);
        setPaymentStatsData(paymentStatsRes);
        setTopCustomers(topCustomersRes);
        setRecentActivities(recentActivitiesRes);
        setStatusDistribution(statusDistributionRes);
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [period]);

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
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500">Overview of your WiFi billing system</p>
        </div>
        <Select
          value={period}
          onChange={(e) => setPeriod(e.target.value as any)}
          options={[
            { value: '7days', label: 'Last 7 Days' },
            { value: '30days', label: 'Last 30 Days' },
            { value: '12months', label: 'Last 12 Months' },
          ]}
        />
      </div>

      {/* Summary Cards */}
      {summary && <DashboardSummary data={summary} />}

      {/* Quick Actions */}
      <QuickActions />

      {/* Charts and Top Customers Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Charts (2 columns on large screens) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {revenueData && (
              <RevenueChart 
                data={revenueData.data} 
                total={revenueData.total} 
                period={period}
              />
            )}
            {customerGrowthData && (
              <CustomerGrowthChart 
                data={customerGrowthData.data} 
                totalNew={customerGrowthData.totalNew} 
                period={period}
              />
            )}
          </div>
          
          {/* Payment Statistics */}
          {paymentStatsData && <PaymentStats data={paymentStatsData} />}
          
          {/* Recent Activity */}
          {recentActivities && recentActivities.length > 0 && (
            <RecentActivity activities={recentActivities} />
          )}
        </div>

        {/* Right Column - Top Customers */}
        <div className="space-y-6">
          {topCustomers && topCustomers.length > 0 && (
            <TopCustomers customers={topCustomers} />
          )}
        </div>
      </div>

      {/* Status Distribution - Full Width */}
      {statusDistribution && (
        <StatusDistribution 
          customerStatus={statusDistribution.customerStatus}
          invoiceStatus={statusDistribution.invoiceStatus}
        />
      )}

      {/* Stats Grid - Legacy */}
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
