'use client';

import { useEffect, useState } from 'react';
import { Plus, Search, Check, X, QrCode } from 'lucide-react';
import { format } from 'date-fns';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge, getStatusBadgeVariant } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { paymentService, invoiceService } from '@/services';
import type { Payment, Invoice } from '@/types';

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [filteredPayments, setFilteredPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isQrisModalOpen, setIsQrisModalOpen] = useState(false);
  const [qrisData, setQrisData] = useState<{ payment: Payment; qrisCode: string } | null>(null);
  const [pendingInvoices, setPendingInvoices] = useState<Invoice[]>([]);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState('');
  const [generatingQris, setGeneratingQris] = useState(false);

  const fetchPayments = async () => {
    try {
      const data = await paymentService.getAll();
      setPayments(data);
      setFilteredPayments(data);
    } catch (error) {
      console.error('Failed to fetch payments:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPendingInvoices = async () => {
    try {
      const data = await invoiceService.getAll('pending');
      setPendingInvoices(data);
    } catch (error) {
      console.error('Failed to fetch pending invoices:', error);
    }
  };

  useEffect(() => {
    fetchPayments();
    fetchPendingInvoices();
  }, []);

  useEffect(() => {
    const filtered = payments.filter(
      (payment) =>
        payment.paymentNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        payment.invoice?.customer?.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredPayments(filtered);
  }, [searchTerm, payments]);

  const handleConfirmPayment = async (id: string) => {
    try {
      await paymentService.confirm(id);
      await fetchPayments();
    } catch (error) {
      console.error('Failed to confirm payment:', error);
    }
  };

  const handleFailPayment = async (id: string) => {
    if (confirm('Mark this payment as failed?')) {
      try {
        await paymentService.fail(id, 'Marked as failed by operator');
        await fetchPayments();
      } catch (error) {
        console.error('Failed to update payment:', error);
      }
    }
  };

  const handleGenerateQris = async () => {
    if (!selectedInvoiceId) return;

    setGeneratingQris(true);
    try {
      const data = await paymentService.generateQris(selectedInvoiceId);
      setQrisData(data);
      await fetchPayments();
    } catch (error) {
      console.error('Failed to generate QRIS:', error);
    } finally {
      setGeneratingQris(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Payments</h1>
          <p className="text-gray-500">Track and manage payments</p>
        </div>
        <Button onClick={() => setIsQrisModalOpen(true)}>
          <QrCode size={20} className="mr-2" />
          Generate QRIS Payment
        </Button>
      </div>

      <Card>
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <Input
              placeholder="Search payments..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-sm text-gray-500 border-b">
                <th className="pb-3 font-medium">Payment #</th>
                <th className="pb-3 font-medium">Customer</th>
                <th className="pb-3 font-medium">Amount</th>
                <th className="pb-3 font-medium">Method</th>
                <th className="pb-3 font-medium">Date</th>
                <th className="pb-3 font-medium">Status</th>
                <th className="pb-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredPayments.length > 0 ? (
                filteredPayments.map((payment) => (
                  <tr key={payment.id} className="text-sm">
                    <td className="py-4 font-medium">{payment.paymentNumber}</td>
                    <td className="py-4">{payment.invoice?.customer?.name || 'N/A'}</td>
                    <td className="py-4">{formatCurrency(Number(payment.amount))}</td>
                    <td className="py-4 capitalize">{payment.method.replace('_', ' ')}</td>
                    <td className="py-4">
                      {format(new Date(payment.createdAt), 'MMM dd, yyyy HH:mm')}
                    </td>
                    <td className="py-4">
                      <Badge variant={getStatusBadgeVariant(payment.status)}>
                        {payment.status}
                      </Badge>
                    </td>
                    <td className="py-4">
                      {payment.status === 'pending' && (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleConfirmPayment(payment.id)}
                            className="p-2 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-lg"
                            title="Confirm Payment"
                          >
                            <Check size={16} />
                          </button>
                          <button
                            onClick={() => handleFailPayment(payment.id)}
                            className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg"
                            title="Mark as Failed"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-gray-500">
                    No payments found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* QRIS Generation Modal */}
      <Modal
        isOpen={isQrisModalOpen}
        onClose={() => {
          setIsQrisModalOpen(false);
          setQrisData(null);
          setSelectedInvoiceId('');
        }}
        title="Generate QRIS Payment"
      >
        {qrisData ? (
          <div className="text-center space-y-4">
            <div className="bg-gray-100 p-8 rounded-lg">
              <QrCode size={120} className="mx-auto text-gray-800" />
              <p className="mt-4 font-mono text-xs break-all">{qrisData.qrisCode}</p>
            </div>
            <div>
              <p className="text-lg font-bold">{formatCurrency(Number(qrisData.payment.amount))}</p>
              <p className="text-sm text-gray-500">Payment #{qrisData.payment.paymentNumber}</p>
            </div>
            <p className="text-sm text-gray-500">
              Scan this QR code with your mobile banking app to complete payment
            </p>
            <Button
              onClick={() => {
                setQrisData(null);
                setSelectedInvoiceId('');
              }}
              variant="secondary"
              className="w-full"
            >
              Generate Another
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Select Invoice
              </label>
              <select
                value={selectedInvoiceId}
                onChange={(e) => setSelectedInvoiceId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">Select an invoice...</option>
                {pendingInvoices.map((invoice) => (
                  <option key={invoice.id} value={invoice.id}>
                    {invoice.invoiceNumber} - {invoice.customer?.name} - {formatCurrency(Number(invoice.amount))}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex justify-end gap-3">
              <Button
                variant="secondary"
                onClick={() => setIsQrisModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleGenerateQris}
                loading={generatingQris}
                disabled={!selectedInvoiceId}
              >
                Generate QRIS
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
