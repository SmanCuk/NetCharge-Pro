import {
  IsString,
  IsNumber,
  IsEnum,
  IsOptional,
  IsUUID,
  IsDateString,
  Min,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { InvoiceStatus } from '../entities/invoice.entity';

export class CreateInvoiceDto {
  @ApiProperty({ example: 'uuid-customer-id' })
  @IsUUID()
  customerId: string;

  @ApiProperty({ example: 150000.0 })
  @IsNumber()
  @Min(0)
  amount: number;

  @ApiProperty({ example: '2024-01-01' })
  @IsDateString()
  billingPeriodStart: string;

  @ApiProperty({ example: '2024-01-31' })
  @IsDateString()
  billingPeriodEnd: string;

  @ApiProperty({ example: '2024-02-10' })
  @IsDateString()
  dueDate: string;

  @ApiProperty({ example: 'Monthly WiFi subscription', required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ enum: InvoiceStatus, default: InvoiceStatus.PENDING })
  @IsEnum(InvoiceStatus)
  @IsOptional()
  status?: InvoiceStatus;
}
