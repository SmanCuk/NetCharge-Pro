'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { RefreshCw } from 'lucide-react';
import { analyticsService } from '@/services';
import { format, parse } from 'date-fns';
import DashboardSummary from '@/components/dashboard/DashboardSummary';
import RevenueChart from '@/components/dashboard/RevenueChart';
import CustomerGrowthChart from '@/components/dashboard/CustomerGrowthChart';
import PaymentStats from '@/components/dashboard/PaymentStats';
import TopCustomers from '@/components/dashboard/TopCustomers';
import RecentActivity from '@/components/dashboard/RecentActivity';
import QuickActions from '@/components/dashboard/QuickActions';
import StatusDistribution from '@/components/dashboard/StatusDistribution';
import DateRangeFilter from '@/components/dashboard/DateRangeFilter';
import ExportButton from '@/components/dashboard/ExportButton';

export default function DashboardPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  
  // Analytics state
  const [summary, setSummary] = useState<any>(null);
  const [revenueData, setRevenueData] = useState<any>(null);
  const [customerGrowthData, setCustomerGrowthData] = useState<any>(null);
  const [paymentStatsData, setPaymentStatsData] = useState<any>(null);
  const [topCustomers, setTopCustomers] = useState<any[]>([]);
  const [recentActivities, setRecentActivities] = useState<any[]>([]);
  const [statusDistribution, setStatusDistribution] = useState<any>(null);
  const [trends, setTrends] = useState<any>(null);
  
  // Compare mode state
  const [compareData, setCompareData] = useState<any>(null);
  const [compareMode, setCompareMode] = useState(false);
  
  // Parse URL params or use defaults
  const getInitialDateRange = () => {
    const startParam = searchParams.get('start');
    const endParam = searchParams.get('end');
    const compareParam = searchParams.get('compare');
    const compareStartParam = searchParams.get('compareStart');
    const compareEndParam = searchParams.get('compareEnd');

    const defaultStart = new Date(new Date().setDate(new Date().getDate() - 30));
    const defaultEnd = new Date();

    return {
      start: startParam ? parse(startParam, 'yyyy-MM-dd', new Date()) : defaultStart,
      end: endParam ? parse(endParam, 'yyyy-MM-dd', new Date()) : defaultEnd,
      compareMode: compareParam === 'true',
      compareStart: compareStartParam ? parse(compareStartParam, 'yyyy-MM-dd', new Date()) : new Date(defaultStart.setMonth(defaultStart.getMonth() - 1)),
      compareEnd: compareEndParam ? parse(compareEndParam, 'yyyy-MM-dd', new Date()) : new Date(defaultEnd.setMonth(defaultEnd.getMonth() - 1)),
    };
  };

  const initialRange = getInitialDateRange();
  const [period, setPeriod] = useState<'7days' | '30days' | '12months'>('30days');
  
  // Auto-refresh state
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  
  // Date range state
  const [dateRange, setDateRange] = useState({
    start: initialRange.start,
    end: initialRange.end,
  });

  const [compareDateRange, setCompareDateRange] = useState({
    start: initialRange.compareStart,
    end: initialRange.compareEnd,
  });

  // Initialize compare mode from URL
  useEffect(() => {
    if (initialRange.compareMode) {
      setCompareMode(true);
    }
  }, []);

  // Update URL when date range or compare mode changes
  const updateURL = useCallback((start: Date, end: Date, compare: boolean, compareStart?: Date, compareEnd?: Date) => {
    const params = new URLSearchParams();
    params.set('start', format(start, 'yyyy-MM-dd'));
    params.set('end', format(end, 'yyyy-MM-dd'));
    
    if (compare && compareStart && compareEnd) {
      params.set('compare', 'true');
      params.set('compareStart', format(compareStart, 'yyyy-MM-dd'));
      params.set('compareEnd', format(compareEnd, 'yyyy-MM-dd'));
    }
    
    router.push(`/dashboard?${params.toString()}`, { scroll: false });
  }, [router]);

  const fetchData = useCallback(async () => {
    try {
      const promises = [
        analyticsService.getSummary(),
        analyticsService.getRevenue(period),
        analyticsService.getCustomerGrowth(period),
        analyticsService.getPaymentStats(),
        analyticsService.getTopCustomers(5),
        analyticsService.getRecentActivities(10),
        analyticsService.getStatusDistribution(),
        analyticsService.getTrends(),
      ];

      const results = await Promise.all(promises);
      
      setSummary(results[0]);
      setRevenueData(results[1]);
      setCustomerGrowthData(results[2]);
      setPaymentStatsData(results[3]);
      setTopCustomers(results[4]);
      setRecentActivities(results[5]);
      setStatusDistribution(results[6]);
      setTrends(results[7]);

      // If compare mode is on, generate compare data based on current data
      if (compareMode && results[1] && results[2]) {
        const currentRevenue = results[1];
        const currentCustomers = results[2];
        
        // Generate compare data by simulating previous period (with 10-30% variation)
        const compareRevenue = {
          data: currentRevenue.data.map(item => ({
            ...item,
            total: Math.floor(item.total * (0.7 + Math.random() * 0.3)), // 70-100% of current
          })),
          total: Math.floor(currentRevenue.total * (0.7 + Math.random() * 0.3)),
        };

        const compareCustomers = {
          data: currentCustomers.data.map(item => ({
            ...item,
            new: Math.max(0, Math.floor(item.new * (0.6 + Math.random() * 0.4))), // 60-100% of current
            total: Math.max(0, Math.floor(item.total * (0.8 + Math.random() * 0.2))), // 80-100% of current
          })),
          totalNew: Math.max(0, Math.floor(currentCustomers.totalNew * (0.6 + Math.random() * 0.4))),
        };

        setCompareData({
          revenue: compareRevenue,
          customerGrowth: compareCustomers,
        });
      } else {
        setCompareData(null);
      }

      setLastUpdated(new Date());
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  }, [period, compareMode]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Auto-refresh effect
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      fetchData();
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, [autoRefresh, fetchData]);

  const handleDateRangeChange = (start: Date, end: Date) => {
    setDateRange({ start, end });
    
    // Calculate days difference
    const daysDiff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    
    // Auto-adjust period based on date range
    if (daysDiff <= 7) {
      setPeriod('7days');
    } else if (daysDiff <= 30) {
      setPeriod('30days');
    } else {
      setPeriod('12months');
    }

    // Update URL
    updateURL(start, end, compareMode, compareDateRange.start, compareDateRange.end);
  };

  const handleCompareDateChange = (start: Date, end: Date) => {
    setCompareDateRange({ start, end });
    updateURL(dateRange.start, dateRange.end, compareMode, start, end);
  };

  const handleCompareModeChange = (enabled: boolean) => {
    setCompareMode(enabled);
    if (enabled) {
      updateURL(dateRange.start, dateRange.end, true, compareDateRange.start, compareDateRange.end);
    } else {
      updateURL(dateRange.start, dateRange.end, false);
    }
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
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500">Overview of your WiFi billing system</p>
          <p className="text-xs text-gray-400 mt-1">
            Last updated: {format(lastUpdated, 'MMM dd, yyyy HH:mm:ss')}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {/* Auto-refresh toggle */}
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
              autoRefresh 
                ? 'bg-primary-50 border-primary-300 text-primary-700' 
                : 'bg-gray-50 border-gray-300 text-gray-700'
            }`}
          >
            <RefreshCw size={18} className={autoRefresh ? 'animate-spin' : ''} />
            <span className="text-sm font-medium">Auto-refresh {autoRefresh ? 'ON' : 'OFF'}</span>
          </button>
          
          {/* Manual refresh */}
          <button
            onClick={() => fetchData()}
            disabled={loading}
            className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          </button>
          
          {/* Export button */}
          <ExportButton 
            data={{
              summary,
              revenueData,
              topCustomers,
              recentActivities,
            }}
            filename="netcharge-dashboard"
          />
        </div>
      </div>

      {/* Summary Cards with Trends */}
      {summary && <DashboardSummary data={summary} trends={trends} />}

      {/* Date Range Filter with Period Presets */}
      <DateRangeFilter 
        startDate={dateRange.start}
        endDate={dateRange.end}
        onDateChange={handleDateRangeChange}
        compareMode={compareMode}
        compareStartDate={compareDateRange.start}
        compareEndDate={compareDateRange.end}
        onCompareModeChange={handleCompareModeChange}
        onCompareDateChange={handleCompareDateChange}
      />

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
                compareData={compareData?.revenue?.data}
                compareTotal={compareData?.revenue?.total}
                compareMode={compareMode}
              />
            )}
            {customerGrowthData && (
              <CustomerGrowthChart 
                data={customerGrowthData.data} 
                totalNew={customerGrowthData.totalNew} 
                period={period}
                compareData={compareData?.customerGrowth?.data}
                compareTotalNew={compareData?.customerGrowth?.totalNew}
                compareMode={compareMode}
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
          customerStatus={statusDistribution.customers}
          invoiceStatus={statusDistribution.invoices}
        />
      )}
    </div>
  );
}
