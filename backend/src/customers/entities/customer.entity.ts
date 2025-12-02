import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { Invoice } from '../../invoices/entities/invoice.entity';

export enum CustomerStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
}

export enum PackageType {
  BASIC = 'basic',
  STANDARD = 'standard',
  PREMIUM = 'premium',
}

@Entity('customers')
export class Customer {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ unique: true })
  email: string;

  @Column()
  phone: string;

  @Column({ nullable: true })
  address: string;

  @Column({
    type: 'enum',
    enum: PackageType,
    default: PackageType.BASIC,
  })
  packageType: PackageType;

  @Column('decimal', { precision: 10, scale: 2 })
  monthlyRate: number;

  @Column({
    type: 'enum',
    enum: CustomerStatus,
    default: CustomerStatus.ACTIVE,
  })
  status: CustomerStatus;

  @Column({ nullable: true })
  macAddress: string;

  @Column({ nullable: true })
  ipAddress: string;

  @Column({ type: 'date', nullable: true })
  billingStartDate: Date;

  @Column({ default: 1 })
  billingDay: number;

  @OneToMany(() => Invoice, (invoice) => invoice.customer)
  invoices: Invoice[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
