import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Payment, PaymentMethod, PaymentStatus } from './entities/payment.entity';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { InvoicesService } from '../invoices/invoices.service';
import { InvoiceStatus } from '../invoices/entities/invoice.entity';

@Injectable()
export class PaymentsService {
  constructor(
    @InjectRepository(Payment)
    private readonly paymentRepository: Repository<Payment>,
    private readonly invoicesService: InvoicesService,
  ) {}

  private generatePaymentNumber(): string {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `PAY-${year}${month}${day}-${random}`;
  }

  private generateQrisCode(paymentNumber: string, amount: number): string {
    // Simplified QRIS code generation
    // In production, this would integrate with actual QRIS payment gateway
    const baseCode = '00020101021226';
    const merchantId = '1234567890123456';
    const amountStr = amount.toFixed(2).replace('.', '');
    return `${baseCode}${merchantId}${amountStr}${paymentNumber}`;
  }

  async create(createPaymentDto: CreatePaymentDto): Promise<Payment> {
    const invoice = await this.invoicesService.findOne(createPaymentDto.invoiceId);

    if (invoice.status === InvoiceStatus.PAID) {
      throw new BadRequestException('Invoice is already paid');
    }

    if (invoice.status === InvoiceStatus.CANCELLED) {
      throw new BadRequestException('Cannot create payment for cancelled invoice');
    }

    const paymentNumber = this.generatePaymentNumber();
    const payment = this.paymentRepository.create({
      ...createPaymentDto,
      paymentNumber,
      status: PaymentStatus.PENDING,
    });

    // Generate QRIS code if payment method is QRIS
    if (createPaymentDto.method === PaymentMethod.QRIS) {
      payment.qrisCode = this.generateQrisCode(paymentNumber, createPaymentDto.amount);
    }

    return this.paymentRepository.save(payment);
  }

  async findAll(): Promise<Payment[]> {
    return this.paymentRepository.find({
      relations: ['invoice', 'invoice.customer'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Payment> {
    const payment = await this.paymentRepository.findOne({
      where: { id },
      relations: ['invoice', 'invoice.customer'],
    });
    if (!payment) {
      throw new NotFoundException('Payment not found');
    }
    return payment;
  }

  async findByInvoice(invoiceId: string): Promise<Payment[]> {
    return this.paymentRepository.find({
      where: { invoiceId },
      order: { createdAt: 'DESC' },
    });
  }

  async confirmPayment(id: string): Promise<Payment> {
    const payment = await this.findOne(id);

    if (payment.status === PaymentStatus.COMPLETED) {
      throw new BadRequestException('Payment is already confirmed');
    }

    payment.status = PaymentStatus.COMPLETED;
    const savedPayment = await this.paymentRepository.save(payment);

    // Update invoice paid amount
    await this.invoicesService.updatePaidAmount(payment.invoiceId, Number(payment.amount));

    return savedPayment;
  }

  async failPayment(id: string, reason?: string): Promise<Payment> {
    const payment = await this.findOne(id);

    if (payment.status !== PaymentStatus.PENDING) {
      throw new BadRequestException('Only pending payments can be marked as failed');
    }

    payment.status = PaymentStatus.FAILED;
    if (reason) {
      payment.notes = reason;
    }

    return this.paymentRepository.save(payment);
  }

  async generateQrisPayment(invoiceId: string): Promise<{
    payment: Payment;
    qrisCode: string;
  }> {
    const invoice = await this.invoicesService.findOne(invoiceId);
    const remainingAmount = Number(invoice.amount) - Number(invoice.paidAmount);

    if (remainingAmount <= 0) {
      throw new BadRequestException('Invoice is already fully paid');
    }

    const payment = await this.create({
      invoiceId,
      amount: remainingAmount,
      method: PaymentMethod.QRIS,
    });

    return {
      payment,
      qrisCode: payment.qrisCode,
    };
  }

  async handleQrisCallback(transactionId: string, status: 'success' | 'failed'): Promise<Payment> {
    // Find payment by transaction ID or payment number
    const payment = await this.paymentRepository.findOne({
      where: { transactionId },
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    if (status === 'success') {
      return this.confirmPayment(payment.id);
    } else {
      return this.failPayment(payment.id, 'QRIS payment failed');
    }
  }

  async getPaymentStats(): Promise<{
    totalPayments: number;
    totalAmount: number;
    byMethod: { method: string; count: number; amount: number }[];
  }> {
    const payments = await this.paymentRepository.find({
      where: { status: PaymentStatus.COMPLETED },
    });

    const byMethod = Object.values(PaymentMethod).map((method) => {
      const methodPayments = payments.filter((p) => p.method === method);
      return {
        method,
        count: methodPayments.length,
        amount: methodPayments.reduce((sum, p) => sum + Number(p.amount), 0),
      };
    });

    return {
      totalPayments: payments.length,
      totalAmount: payments.reduce((sum, p) => sum + Number(p.amount), 0),
      byMethod,
    };
  }
}
