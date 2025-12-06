import api from '@/lib/api';
import type { AuthResponse, User, Customer, Invoice, Payment, DashboardStats } from '@/types';

// Auth services
export const authService = {
  login: async (email: string, password: string): Promise<AuthResponse> => {
    const response = await api.post('/api/auth/login', { email, password });
    return response.data;
  },
  getProfile: async (): Promise<User> => {
    const response = await api.get('/api/auth/profile');
    return response.data;
  },
};

// Customer services
export const customerService = {
  getAll: async (status?: string): Promise<Customer[]> => {
    const params = status ? { status } : {};
    const response = await api.get('/api/customers', { params });
    return response.data;
  },
  getOne: async (id: string): Promise<Customer> => {
    const response = await api.get(`/api/customers/${id}`);
    return response.data;
  },
  create: async (data: Partial<Customer>): Promise<Customer> => {
    const response = await api.post('/api/customers', data);
    return response.data;
  },
  update: async (id: string, data: Partial<Customer>): Promise<Customer> => {
    const response = await api.patch(`/api/customers/${id}`, data);
    return response.data;
  },
  delete: async (id: string): Promise<void> => {
    await api.delete(`/api/customers/${id}`);
  },
  suspend: async (id: string): Promise<Customer> => {
    const response = await api.post(`/api/customers/${id}/suspend`);
    return response.data;
  },
  activate: async (id: string): Promise<Customer> => {
    const response = await api.post(`/api/customers/${id}/activate`);
    return response.data;
  },
};

// Invoice services
export const invoiceService = {
  getAll: async (status?: string): Promise<Invoice[]> => {
    const params = status ? { status } : {};
    const response = await api.get('/api/invoices', { params });
    return response.data;
  },
  getOne: async (id: string): Promise<Invoice> => {
    const response = await api.get(`/api/invoices/${id}`);
    return response.data;
  },
  getByCustomer: async (customerId: string): Promise<Invoice[]> => {
    const response = await api.get(`/api/invoices/customer/${customerId}`);
    return response.data;
  },
  create: async (data: Partial<Invoice>): Promise<Invoice> => {
    const response = await api.post('/api/invoices', data);
    return response.data;
  },
  update: async (id: string, data: Partial<Invoice>): Promise<Invoice> => {
    const response = await api.patch(`/api/invoices/${id}`, data);
    return response.data;
  },
  delete: async (id: string): Promise<void> => {
    await api.delete(`/api/invoices/${id}`);
  },
  generateMonthly: async (): Promise<Invoice[]> => {
    const response = await api.post('/api/invoices/generate/monthly');
    return response.data;
  },
  markOverdue: async (): Promise<number> => {
    const response = await api.post('/api/invoices/mark-overdue');
    return response.data;
  },
  getDashboardStats: async (): Promise<DashboardStats> => {
    const response = await api.get('/api/invoices/dashboard/stats');
    return response.data;
  },
};

// Payment services
export const paymentService = {
  getAll: async (): Promise<Payment[]> => {
    const response = await api.get('/api/payments');
    return response.data;
  },
  getOne: async (id: string): Promise<Payment> => {
    const response = await api.get(`/api/payments/${id}`);
    return response.data;
  },
  getByInvoice: async (invoiceId: string): Promise<Payment[]> => {
    const response = await api.get(`/api/payments/invoice/${invoiceId}`);
    return response.data;
  },
  create: async (data: Partial<Payment>): Promise<Payment> => {
    const response = await api.post('/api/payments', data);
    return response.data;
  },
  confirm: async (id: string): Promise<Payment> => {
    const response = await api.post(`/api/payments/${id}/confirm`);
    return response.data;
  },
  fail: async (id: string, reason?: string): Promise<Payment> => {
    const response = await api.post(`/api/payments/${id}/fail`, { reason });
    return response.data;
  },
  generateQris: async (invoiceId: string): Promise<{ payment: Payment; qrisCode: string }> => {
    const response = await api.post(`/api/payments/qris/generate/${invoiceId}`);
    return response.data;
  },
  getStats: async () => {
    const response = await api.get('/api/payments/stats');
    return response.data;
  },
};

// Analytics services
export const analyticsService = {
  getRevenue: async (period: '7days' | '30days' | '12months' = '30days') => {
    const response = await api.get('/api/analytics/revenue', { params: { period } });
    return response.data;
  },
  getCustomerGrowth: async (period: '7days' | '30days' | '12months' = '30days') => {
    const response = await api.get('/api/analytics/customers', { params: { period } });
    return response.data;
  },
  getPaymentStats: async () => {
    const response = await api.get('/api/analytics/payments');
    return response.data;
  },
  getSummary: async () => {
    const response = await api.get('/api/analytics/summary');
    return response.data;
  },
  getTopCustomers: async (limit: number = 5) => {
    const response = await api.get('/api/analytics/top-customers', { params: { limit } });
    return response.data;
  },
  getRecentActivities: async (limit: number = 10) => {
    const response = await api.get('/api/analytics/recent-activities', { params: { limit } });
    return response.data;
  },
  getStatusDistribution: async () => {
    const response = await api.get('/api/analytics/status-distribution');
    return response.data;
  },
  getTrends: async () => {
    const response = await api.get('/api/analytics/trends');
    return response.data;
  },
};
