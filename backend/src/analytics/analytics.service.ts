import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThanOrEqual } from 'typeorm';
import { Customer, CustomerStatus } from '../customers/entities/customer.entity';
import { Invoice, InvoiceStatus } from '../invoices/entities/invoice.entity';
import { Payment } from '../payments/entities/payment.entity';

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectRepository(Customer)
    private readonly customerRepository: Repository<Customer>,
    @InjectRepository(Invoice)
    private readonly invoiceRepository: Repository<Invoice>,
    @InjectRepository(Payment)
    private readonly paymentRepository: Repository<Payment>,
  ) {}

  async getRevenueStats(period: string) {
    const { startDate, groupBy } = this.getPeriodConfig(period);

    const query = this.paymentRepository
      .createQueryBuilder('payment')
      .select(`DATE_TRUNC('${groupBy}', payment.createdAt)`, 'date')
      .addSelect('SUM(payment.amount)', 'revenue')
      .where('payment.createdAt >= :startDate', { startDate })
      .andWhere('payment.status = :status', { status: 'completed' })
      .groupBy('date')
      .orderBy('date', 'ASC');

    const results = await query.getRawMany();

    return {
      period,
      data: results.map(r => ({
        date: r.date,
        revenue: parseFloat(r.revenue) || 0,
      })),
      total: results.reduce((sum, r) => sum + parseFloat(r.revenue || 0), 0),
    };
  }

  async getCustomerGrowth(period: string) {
    const { startDate, groupBy } = this.getPeriodConfig(period);

    const query = this.customerRepository
      .createQueryBuilder('customer')
      .select(`DATE_TRUNC('${groupBy}', customer.createdAt)`, 'date')
      .addSelect('COUNT(*)', 'count')
      .where('customer.createdAt >= :startDate', { startDate })
      .groupBy('date')
      .orderBy('date', 'ASC');

    const results = await query.getRawMany();

    // Calculate cumulative count
    let cumulative = 0;
    const data = results.map(r => {
      cumulative += parseInt(r.count);
      return {
        date: r.date,
        new: parseInt(r.count),
        total: cumulative,
      };
    });

    return {
      period,
      data,
      totalNew: results.reduce((sum, r) => sum + parseInt(r.count), 0),
    };
  }

  async getPaymentStats() {
    const total = await this.paymentRepository.count();
    
    const byMethod = await this.paymentRepository
      .createQueryBuilder('payment')
      .select('payment.method', 'method')
      .addSelect('COUNT(*)', 'count')
      .addSelect('SUM(payment.amount)', 'total')
      .groupBy('payment.method')
      .getRawMany();

    const last30Days = new Date();
    last30Days.setDate(last30Days.getDate() - 30);

    const recent = await this.paymentRepository.count({
      where: { createdAt: MoreThanOrEqual(last30Days) },
    });

    return {
      total,
      recent,
      byMethod: byMethod.map(m => ({
        method: m.method,
        count: parseInt(m.count),
        total: parseFloat(m.total) || 0,
      })),
    };
  }

  async getDashboardSummary() {
    const [
      totalCustomers,
      activeCustomers,
      totalInvoices,
      paidInvoices,
      totalRevenue,
      monthRevenue,
    ] = await Promise.all([
      this.customerRepository.count(),
      this.customerRepository.count({ where: { status: CustomerStatus.ACTIVE } }),
      this.invoiceRepository.count(),
      this.invoiceRepository.count({ where: { status: InvoiceStatus.PAID } }),
      this.getTotalRevenue(),
      this.getMonthRevenue(),
    ]);

    const pendingInvoices = totalInvoices - paidInvoices;

    return {
      customers: {
        total: totalCustomers,
        active: activeCustomers,
        inactive: totalCustomers - activeCustomers,
      },
      invoices: {
        total: totalInvoices,
        paid: paidInvoices,
        pending: pendingInvoices,
      },
      revenue: {
        total: totalRevenue,
        thisMonth: monthRevenue,
      },
    };
  }

  private async getTotalRevenue(): Promise<number> {
    const result = await this.paymentRepository
      .createQueryBuilder('payment')
      .select('SUM(payment.amount)', 'total')
      .getRawOne();

    return parseFloat(result?.total) || 0;
  }

  private async getMonthRevenue(): Promise<number> {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const result = await this.paymentRepository
      .createQueryBuilder('payment')
      .select('SUM(payment.amount)', 'total')
      .where('payment.paymentDate >= :startDate', { startDate: startOfMonth })
      .getRawOne();

    return parseFloat(result?.total) || 0;
  }

  private getPeriodConfig(period: string) {
    const now = new Date();
    let startDate: Date;
    let groupBy: string;

    switch (period) {
      case '7days':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        groupBy = 'day';
        break;
      case '12months':
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        groupBy = 'month';
        break;
      case '30days':
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        groupBy = 'day';
        break;
    }

    return { startDate, groupBy };
  }

  async getTopCustomers(limit: number = 5) {
    const customers = await this.invoiceRepository
      .createQueryBuilder('invoice')
      .select('invoice.customerId', 'customerId')
      .addSelect('customer.name', 'customerName')
      .addSelect('customer.email', 'customerEmail')
      .addSelect('SUM(invoice.amount)', 'totalRevenue')
      .addSelect('COUNT(invoice.id)', 'invoiceCount')
      .innerJoin('invoice.customer', 'customer')
      .where('invoice.status = :status', { status: InvoiceStatus.PAID })
      .groupBy('invoice.customerId')
      .addGroupBy('customer.name')
      .addGroupBy('customer.email')
      .orderBy('totalRevenue', 'DESC')
      .limit(limit)
      .getRawMany();

    return customers.map(c => ({
      customerId: c.customerId,
      customerName: c.customerName,
      customerEmail: c.customerEmail,
      totalRevenue: parseFloat(c.totalRevenue),
      invoiceCount: parseInt(c.invoiceCount),
    }));
  }

  async getRecentActivities(limit: number = 10) {
    const [recentPayments, recentInvoices] = await Promise.all([
      this.paymentRepository
        .createQueryBuilder('payment')
        .leftJoinAndSelect('payment.invoice', 'invoice')
        .leftJoinAndSelect('invoice.customer', 'customer')
        .orderBy('payment.createdAt', 'DESC')
        .limit(limit)
        .getMany(),
      this.invoiceRepository
        .createQueryBuilder('invoice')
        .leftJoinAndSelect('invoice.customer', 'customer')
        .where('invoice.createdAt >= :date', { 
          date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) 
        })
        .orderBy('invoice.createdAt', 'DESC')
        .limit(limit)
        .getMany(),
    ]);

    const activities = [
      ...recentPayments.map(p => ({
        id: p.id,
        type: 'payment' as const,
        title: `Payment received from ${p.invoice?.customer?.name || 'Unknown'}`,
        amount: p.amount,
        date: p.createdAt,
        status: p.status,
        customerName: p.invoice?.customer?.name,
      })),
      ...recentInvoices.map(i => ({
        id: i.id,
        type: 'invoice' as const,
        title: `Invoice ${i.invoiceNumber} created for ${i.customer?.name || 'Unknown'}`,
        amount: i.amount,
        date: i.createdAt,
        status: i.status,
        customerName: i.customer?.name,
      })),
    ];

    return activities
      .sort((a, b) => b.date.getTime() - a.date.getTime())
      .slice(0, limit);
  }

  async getStatusDistribution() {
    const [customersByStatus, invoicesByStatus] = await Promise.all([
      this.customerRepository
        .createQueryBuilder('customer')
        .select('customer.status', 'status')
        .addSelect('COUNT(*)', 'count')
        .groupBy('customer.status')
        .getRawMany(),
      this.invoiceRepository
        .createQueryBuilder('invoice')
        .select('invoice.status', 'status')
        .addSelect('COUNT(*)', 'count')
        .addSelect('SUM(invoice.amount)', 'total')
        .groupBy('invoice.status')
        .getRawMany(),
    ]);

    return {
      customers: customersByStatus.map(c => ({
        status: c.status,
        count: parseInt(c.count),
      })),
      invoices: invoicesByStatus.map(i => ({
        status: i.status,
        count: parseInt(i.count),
        total: parseFloat(i.total) || 0,
      })),
    };
  }

  async getTrendComparison() {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

    // Current period (last 30 days)
    const [currentCustomers, currentInvoices, currentRevenue] = await Promise.all([
      this.customerRepository.count({
        where: { createdAt: MoreThanOrEqual(thirtyDaysAgo) },
      }),
      this.invoiceRepository.count({
        where: { createdAt: MoreThanOrEqual(thirtyDaysAgo) },
      }),
      this.paymentRepository
        .createQueryBuilder('payment')
        .select('SUM(payment.amount)', 'total')
        .where('payment.createdAt >= :startDate', { startDate: thirtyDaysAgo })
        .getRawOne()
        .then(r => parseFloat(r?.total) || 0),
    ]);

    // Previous period (30-60 days ago)
    const [previousCustomers, previousInvoices, previousRevenue] = await Promise.all([
      this.customerRepository.count({
        where: { 
          createdAt: MoreThanOrEqual(sixtyDaysAgo),
        },
      }).then(total => total - currentCustomers),
      this.invoiceRepository.count({
        where: { 
          createdAt: MoreThanOrEqual(sixtyDaysAgo),
        },
      }).then(total => total - currentInvoices),
      this.paymentRepository
        .createQueryBuilder('payment')
        .select('SUM(payment.amount)', 'total')
        .where('payment.createdAt >= :startDate', { startDate: sixtyDaysAgo })
        .andWhere('payment.createdAt < :endDate', { endDate: thirtyDaysAgo })
        .getRawOne()
        .then(r => parseFloat(r?.total) || 0),
    ]);

    // Calculate percentage changes
    const calculateChange = (current: number, previous: number): number => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return Math.round(((current - previous) / previous) * 100);
    };

    // This month vs last month revenue
    const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    const [thisMonthRevenue, lastMonthRevenue] = await Promise.all([
      this.paymentRepository
        .createQueryBuilder('payment')
        .select('SUM(payment.amount)', 'total')
        .where('payment.createdAt >= :startDate', { startDate: startOfThisMonth })
        .getRawOne()
        .then(r => parseFloat(r?.total) || 0),
      this.paymentRepository
        .createQueryBuilder('payment')
        .select('SUM(payment.amount)', 'total')
        .where('payment.createdAt >= :startDate', { startDate: startOfLastMonth })
        .andWhere('payment.createdAt <= :endDate', { endDate: endOfLastMonth })
        .getRawOne()
        .then(r => parseFloat(r?.total) || 0),
    ]);

    return {
      customers: calculateChange(currentCustomers, previousCustomers),
      invoices: calculateChange(currentInvoices, previousInvoices),
      revenue: calculateChange(currentRevenue, previousRevenue),
      thisMonth: calculateChange(thisMonthRevenue, lastMonthRevenue),
    };
  }
}
