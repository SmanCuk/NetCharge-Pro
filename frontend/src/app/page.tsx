'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import { Wifi } from 'lucide-react';

export default function Home() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (isAuthenticated) {
      router.push('/dashboard');
    } else {
      router.push('/login');
    }
  }, [isAuthenticated, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-500 to-primary-700">
      <div className="text-center text-white">
        <Wifi className="h-16 w-16 mx-auto mb-4 animate-pulse" />
        <h1 className="text-3xl font-bold">NetCharge Pro</h1>
        <p className="mt-2 text-primary-100">Loading...</p>
      </div>
    </div>
  );
}
