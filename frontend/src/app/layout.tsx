import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'NetCharge Pro - WiFi Billing System',
  description: 'Modern WiFi billing and customer management system',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="font-sans">{children}</body>
    </html>
  );
}
