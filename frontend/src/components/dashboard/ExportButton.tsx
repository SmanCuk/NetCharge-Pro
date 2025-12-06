'use client';

import React, { useState } from 'react';
import { Download, FileSpreadsheet, FileText } from 'lucide-react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';

interface ExportButtonProps {
  data: any;
  filename?: string;
}

export default function ExportButton({ data, filename = 'dashboard-report' }: ExportButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [exporting, setExporting] = useState(false);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const exportToExcel = () => {
    setExporting(true);
    try {
      const wb = XLSX.utils.book_new();

      // Summary Sheet
      const summaryData = [
        ['NetCharge Pro - Dashboard Report'],
        ['Generated:', format(new Date(), 'PPpp')],
        [],
        ['SUMMARY'],
        ['Total Customers', data.summary?.customers?.total || 0],
        ['Active Customers', data.summary?.customers?.active || 0],
        ['Inactive Customers', data.summary?.customers?.inactive || 0],
        [],
        ['Total Invoices', data.summary?.invoices?.total || 0],
        ['Paid Invoices', data.summary?.invoices?.paid || 0],
        ['Pending Invoices', data.summary?.invoices?.pending || 0],
        [],
        ['Total Revenue', formatCurrency(data.summary?.revenue?.total || 0)],
        ['This Month Revenue', formatCurrency(data.summary?.revenue?.thisMonth || 0)],
      ];
      const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(wb, summarySheet, 'Summary');

      // Revenue Sheet
      if (data.revenueData?.data?.length > 0) {
        const revenueData = [
          ['Date', 'Revenue'],
          ...data.revenueData.data.map((item: any) => [
            format(new Date(item.date), 'MMM dd, yyyy'),
            item.revenue,
          ]),
          [],
          ['Total Revenue', data.revenueData.total],
        ];
        const revenueSheet = XLSX.utils.aoa_to_sheet(revenueData);
        XLSX.utils.book_append_sheet(wb, revenueSheet, 'Revenue');
      }

      // Top Customers Sheet
      if (data.topCustomers?.length > 0) {
        const customersData = [
          ['Rank', 'Customer Name', 'Email', 'Total Revenue', 'Invoice Count'],
          ...data.topCustomers.map((customer: any, index: number) => [
            index + 1,
            customer.name,
            customer.email,
            parseFloat(customer.totalRevenue),
            customer.invoiceCount,
          ]),
        ];
        const customersSheet = XLSX.utils.aoa_to_sheet(customersData);
        XLSX.utils.book_append_sheet(wb, customersSheet, 'Top Customers');
      }

      // Recent Activities Sheet
      if (data.recentActivities?.length > 0) {
        const activitiesData = [
          ['Type', 'Description', 'Amount', 'Status', 'Date'],
          ...data.recentActivities.map((activity: any) => [
            activity.type,
            activity.description,
            activity.amount ? parseFloat(activity.amount) : '',
            activity.status,
            format(new Date(activity.createdAt), 'MMM dd, yyyy HH:mm'),
          ]),
        ];
        const activitiesSheet = XLSX.utils.aoa_to_sheet(activitiesData);
        XLSX.utils.book_append_sheet(wb, activitiesSheet, 'Recent Activities');
      }

      XLSX.writeFile(wb, `${filename}-${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
    } catch (error) {
      console.error('Export to Excel failed:', error);
      alert('Failed to export to Excel');
    } finally {
      setExporting(false);
      setIsOpen(false);
    }
  };

  const exportToPDF = () => {
    setExporting(true);
    try {
      const doc = new jsPDF();

      // Header
      doc.setFontSize(18);
      doc.setTextColor(37, 99, 235); // primary-600
      doc.text('NetCharge Pro', 14, 20);
      doc.setFontSize(14);
      doc.setTextColor(0, 0, 0);
      doc.text('Dashboard Report', 14, 28);
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text(`Generated: ${format(new Date(), 'PPpp')}`, 14, 34);

      let yPos = 45;

      // Summary Section
      doc.setFontSize(12);
      doc.setTextColor(0, 0, 0);
      doc.text('Summary', 14, yPos);
      yPos += 8;

      autoTable(doc, {
        startY: yPos,
        head: [['Metric', 'Value']],
        body: [
          ['Total Customers', data.summary?.customers?.total || 0],
          ['Active Customers', data.summary?.customers?.active || 0],
          ['Total Invoices', data.summary?.invoices?.total || 0],
          ['Paid Invoices', data.summary?.invoices?.paid || 0],
          ['Total Revenue', formatCurrency(data.summary?.revenue?.total || 0)],
          ['This Month Revenue', formatCurrency(data.summary?.revenue?.thisMonth || 0)],
        ],
        theme: 'striped',
        headStyles: { fillColor: [37, 99, 235] },
      });

      yPos = (doc as any).lastAutoTable.finalY + 10;

      // Top Customers Section
      if (data.topCustomers?.length > 0) {
        doc.text('Top Customers', 14, yPos);
        yPos += 8;

        autoTable(doc, {
          startY: yPos,
          head: [['Rank', 'Customer', 'Email', 'Revenue', 'Invoices']],
          body: data.topCustomers.map((customer: any, index: number) => [
            index + 1,
            customer.name,
            customer.email,
            formatCurrency(parseFloat(customer.totalRevenue)),
            customer.invoiceCount,
          ]),
          theme: 'striped',
          headStyles: { fillColor: [37, 99, 235] },
        });

        yPos = (doc as any).lastAutoTable.finalY + 10;
      }

      // Add new page if needed
      if (yPos > 250) {
        doc.addPage();
        yPos = 20;
      }

      // Recent Activities Section
      if (data.recentActivities?.length > 0) {
        doc.text('Recent Activities', 14, yPos);
        yPos += 8;

        autoTable(doc, {
          startY: yPos,
          head: [['Type', 'Description', 'Amount', 'Status', 'Date']],
          body: data.recentActivities.slice(0, 10).map((activity: any) => [
            activity.type,
            activity.description.substring(0, 30),
            activity.amount ? formatCurrency(parseFloat(activity.amount)) : '-',
            activity.status,
            format(new Date(activity.createdAt), 'MMM dd, HH:mm'),
          ]),
          theme: 'striped',
          headStyles: { fillColor: [37, 99, 235] },
        });
      }

      doc.save(`${filename}-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
    } catch (error) {
      console.error('Export to PDF failed:', error);
      alert('Failed to export to PDF');
    } finally {
      setExporting(false);
      setIsOpen(false);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={exporting}
        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <Download size={18} />
        <span className="font-medium">Export</span>
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-200 z-20">
            <button
              onClick={exportToExcel}
              disabled={exporting}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left disabled:opacity-50"
            >
              <FileSpreadsheet size={18} className="text-green-600" />
              <span className="text-sm font-medium">Export to Excel</span>
            </button>
            <button
              onClick={exportToPDF}
              disabled={exporting}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left border-t disabled:opacity-50"
            >
              <FileText size={18} className="text-red-600" />
              <span className="text-sm font-medium">Export to PDF</span>
            </button>
          </div>
        </>
      )}
    </div>
  );
}
