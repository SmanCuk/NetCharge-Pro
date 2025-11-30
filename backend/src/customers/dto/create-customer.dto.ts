import {
  IsEmail,
  IsString,
  IsEnum,
  IsNumber,
  IsOptional,
  Min,
  Max,
  IsDateString,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { PackageType, CustomerStatus } from '../entities/customer.entity';

export class CreateCustomerDto {
  @ApiProperty({ example: 'John Doe' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'john@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: '+6281234567890' })
  @IsString()
  phone: string;

  @ApiProperty({ example: 'Jl. Merdeka No. 123', required: false })
  @IsString()
  @IsOptional()
  address?: string;

  @ApiProperty({ enum: PackageType, default: PackageType.BASIC })
  @IsEnum(PackageType)
  @IsOptional()
  packageType?: PackageType;

  @ApiProperty({ example: 150000.0 })
  @IsNumber()
  @Min(0)
  monthlyRate: number;

  @ApiProperty({ enum: CustomerStatus, default: CustomerStatus.ACTIVE })
  @IsEnum(CustomerStatus)
  @IsOptional()
  status?: CustomerStatus;

  @ApiProperty({ example: 'AA:BB:CC:DD:EE:FF', required: false })
  @IsString()
  @IsOptional()
  macAddress?: string;

  @ApiProperty({ example: '192.168.1.100', required: false })
  @IsString()
  @IsOptional()
  ipAddress?: string;

  @ApiProperty({ example: '2024-01-01', required: false })
  @IsDateString()
  @IsOptional()
  billingStartDate?: string;

  @ApiProperty({ example: 1, minimum: 1, maximum: 28 })
  @IsNumber()
  @Min(1)
  @Max(28)
  @IsOptional()
  billingDay?: number;
}
