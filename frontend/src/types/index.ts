export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'operator';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  address?: string;
  packageType: 'basic' | 'standard' | 'premium';
  monthlyRate: number;
  status: 'active' | 'inactive' | 'suspended';
  macAddress?: string;
  ipAddress?: string;
  billingStartDate?: string;
  billingDay: number;
  createdAt: string;
  updatedAt: string;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  customerId: string;
  customer?: Customer;
  amount: number;
  paidAmount: number;
  status: 'pending' | 'paid' | 'overdue' | 'cancelled';
  billingPeriodStart: string;
  billingPeriodEnd: string;
  dueDate: string;
  description?: string;
  payments?: Payment[];
  createdAt: string;
  updatedAt: string;
}

export interface Payment {
  id: string;
  paymentNumber: string;
  invoiceId: string;
  invoice?: Invoice;
  amount: number;
  method: 'cash' | 'bank_transfer' | 'qris';
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  transactionId?: string;
  qrisCode?: string;
  notes?: string;
  paidBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DashboardStats {
  totalPending: number;
  totalOverdue: number;
  totalPaidThisMonth: number;
  totalRevenueThisMonth: number;
}

export interface AuthResponse {
  access_token: string;
  user: Pick<User, 'id' | 'email' | 'name' | 'role'>;
}
