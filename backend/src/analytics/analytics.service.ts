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
}
