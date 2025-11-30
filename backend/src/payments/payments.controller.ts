import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PaymentsService } from './payments.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('payments')
@ApiBearerAuth()
@Controller('api/payments')
@UseGuards(JwtAuthGuard)
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new payment' })
  create(@Body() createPaymentDto: CreatePaymentDto) {
    return this.paymentsService.create(createPaymentDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all payments' })
  findAll() {
    return this.paymentsService.findAll();
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get payment statistics' })
  getStats() {
    return this.paymentsService.getPaymentStats();
  }

  @Get('invoice/:invoiceId')
  @ApiOperation({ summary: 'Get payments by invoice' })
  findByInvoice(@Param('invoiceId') invoiceId: string) {
    return this.paymentsService.findByInvoice(invoiceId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get payment by ID' })
  findOne(@Param('id') id: string) {
    return this.paymentsService.findOne(id);
  }

  @Post(':id/confirm')
  @ApiOperation({ summary: 'Confirm payment' })
  confirm(@Param('id') id: string) {
    return this.paymentsService.confirmPayment(id);
  }

  @Post(':id/fail')
  @ApiOperation({ summary: 'Mark payment as failed' })
  fail(@Param('id') id: string, @Body('reason') reason?: string) {
    return this.paymentsService.failPayment(id, reason);
  }

  @Post('qris/generate/:invoiceId')
  @ApiOperation({ summary: 'Generate QRIS payment for an invoice' })
  generateQris(@Param('invoiceId') invoiceId: string) {
    return this.paymentsService.generateQrisPayment(invoiceId);
  }

  @Post('qris/callback')
  @ApiOperation({ summary: 'Handle QRIS payment callback (webhook)' })
  handleQrisCallback(
    @Body('transactionId') transactionId: string,
    @Body('status') status: 'success' | 'failed',
  ) {
    return this.paymentsService.handleQrisCallback(transactionId, status);
  }
}
