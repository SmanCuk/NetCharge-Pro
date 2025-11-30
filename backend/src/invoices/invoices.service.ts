import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, LessThan } from 'typeorm';
import { Invoice, InvoiceStatus } from './entities/invoice.entity';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { UpdateInvoiceDto } from './dto/update-invoice.dto';
import { CustomersService } from '../customers/customers.service';

@Injectable()
export class InvoicesService {
  constructor(
    @InjectRepository(Invoice)
    private readonly invoiceRepository: Repository<Invoice>,
    private readonly customersService: CustomersService,
  ) {}

  private generateInvoiceNumber(): string {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `INV-${year}${month}-${random}`;
  }

  async create(createInvoiceDto: CreateInvoiceDto): Promise<Invoice> {
    await this.customersService.findOne(createInvoiceDto.customerId);

    const invoice = this.invoiceRepository.create({
      ...createInvoiceDto,
      invoiceNumber: this.generateInvoiceNumber(),
    });

    return this.invoiceRepository.save(invoice);
  }

  async findAll(status?: InvoiceStatus): Promise<Invoice[]> {
    const queryOptions: any = {
      relations: ['customer'],
      order: { createdAt: 'DESC' },
    };

    if (status) {
      queryOptions.where = { status };
    }

    return this.invoiceRepository.find(queryOptions);
  }

  async findOne(id: string): Promise<Invoice> {
    const invoice = await this.invoiceRepository.findOne({
      where: { id },
      relations: ['customer', 'payments'],
    });
    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }
    return invoice;
  }

  async findByCustomer(customerId: string): Promise<Invoice[]> {
    return this.invoiceRepository.find({
      where: { customerId },
      relations: ['payments'],
      order: { createdAt: 'DESC' },
    });
  }

  async update(id: string, updateInvoiceDto: UpdateInvoiceDto): Promise<Invoice> {
    const invoice = await this.invoiceRepository.findOne({ where: { id } });
    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }

    await this.invoiceRepository.update(id, updateInvoiceDto);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    const invoice = await this.invoiceRepository.findOne({ where: { id } });
    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }
    await this.invoiceRepository.delete(id);
  }

  async updatePaidAmount(id: string, amount: number): Promise<Invoice> {
    const invoice = await this.findOne(id);
    invoice.paidAmount = Number(invoice.paidAmount) + amount;

    if (invoice.paidAmount >= invoice.amount) {
      invoice.status = InvoiceStatus.PAID;
    }

    return this.invoiceRepository.save(invoice);
  }

  async markAsOverdue(): Promise<number> {
    const today = new Date();
    const result = await this.invoiceRepository.update(
      {
        status: InvoiceStatus.PENDING,
        dueDate: LessThan(today),
      },
      { status: InvoiceStatus.OVERDUE },
    );
    return result.affected || 0;
  }

  async generateMonthlyInvoices(): Promise<Invoice[]> {
    const activeCustomers = await this.customersService.getActiveCustomers();
    const today = new Date();
    const invoices: Invoice[] = [];

    for (const customer of activeCustomers) {
      const billingPeriodStart = new Date(today.getFullYear(), today.getMonth(), 1);
      const billingPeriodEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      const dueDate = new Date(today.getFullYear(), today.getMonth() + 1, 10);

      const invoice = await this.create({
        customerId: customer.id,
        amount: Number(customer.monthlyRate),
        billingPeriodStart: billingPeriodStart.toISOString().split('T')[0],
        billingPeriodEnd: billingPeriodEnd.toISOString().split('T')[0],
        dueDate: dueDate.toISOString().split('T')[0],
        description: `WiFi subscription for ${billingPeriodStart.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`,
      });

      invoices.push(invoice);
    }

    return invoices;
  }

  async getDashboardStats(): Promise<{
    totalPending: number;
    totalOverdue: number;
    totalPaidThisMonth: number;
    totalRevenueThisMonth: number;
  }> {
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    const pendingInvoices = await this.invoiceRepository.find({
      where: { status: InvoiceStatus.PENDING },
    });

    const overdueInvoices = await this.invoiceRepository.find({
      where: { status: InvoiceStatus.OVERDUE },
    });

    const paidThisMonth = await this.invoiceRepository.find({
      where: {
        status: InvoiceStatus.PAID,
        updatedAt: Between(startOfMonth, endOfMonth),
      },
    });

    return {
      totalPending: pendingInvoices.reduce((sum, inv) => sum + Number(inv.amount), 0),
      totalOverdue: overdueInvoices.reduce((sum, inv) => sum + Number(inv.amount), 0),
      totalPaidThisMonth: paidThisMonth.length,
      totalRevenueThisMonth: paidThisMonth.reduce((sum, inv) => sum + Number(inv.paidAmount), 0),
    };
  }
}
