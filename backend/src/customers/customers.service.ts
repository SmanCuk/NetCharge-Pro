import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Customer, CustomerStatus } from './entities/customer.entity';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';

@Injectable()
export class CustomersService {
  constructor(
    @InjectRepository(Customer)
    private readonly customerRepository: Repository<Customer>,
  ) {}

  async create(createCustomerDto: CreateCustomerDto): Promise<Customer> {
    const existingCustomer = await this.customerRepository.findOne({
      where: { email: createCustomerDto.email },
    });

    if (existingCustomer) {
      throw new ConflictException('Customer with this email already exists');
    }

    const customer = this.customerRepository.create(createCustomerDto);
    return this.customerRepository.save(customer);
  }

  async findAll(status?: CustomerStatus): Promise<Customer[]> {
    if (status) {
      return this.customerRepository.find({ where: { status } });
    }
    return this.customerRepository.find();
  }

  async findOne(id: string): Promise<Customer> {
    const customer = await this.customerRepository.findOne({
      where: { id },
      relations: ['invoices'],
    });
    if (!customer) {
      throw new NotFoundException('Customer not found');
    }
    return customer;
  }

  async findByPhone(phone: string): Promise<Customer | null> {
    return this.customerRepository.findOne({
      where: { phone },
      relations: ['invoices'],
    });
  }

  async update(id: string, updateCustomerDto: UpdateCustomerDto): Promise<Customer> {
    const customer = await this.customerRepository.findOne({ where: { id } });
    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    await this.customerRepository.update(id, updateCustomerDto);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    const customer = await this.customerRepository.findOne({ where: { id } });
    if (!customer) {
      throw new NotFoundException('Customer not found');
    }
    await this.customerRepository.delete(id);
  }

  async getActiveCustomers(): Promise<Customer[]> {
    return this.customerRepository.find({
      where: { status: CustomerStatus.ACTIVE },
    });
  }

  async suspendCustomer(id: string): Promise<Customer> {
    const customer = await this.findOne(id);
    customer.status = CustomerStatus.SUSPENDED;
    return this.customerRepository.save(customer);
  }

  async activateCustomer(id: string): Promise<Customer> {
    const customer = await this.findOne(id);
    customer.status = CustomerStatus.ACTIVE;
    return this.customerRepository.save(customer);
  }
}
