'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';
import { api } from '@/lib/api';
import Link from 'next/link';

interface OrderVerify {
  orderRef: string;
  status: string;
  subtotalPaise: number;
  customerName: string;
  snapshotJson: {
    items: Array<{ name: string; weight: string; quantity: number; lineTotal: number }>;
    address: string;
  };
  createdAt: string;
}

function VerifyContent() {
  const params = useSearchParams();
  const ref = params.get('ref');
  const token = params.get('token');
  const [order, setOrder] = useState<OrderVerify | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!ref || !token) {
      setError('Invalid verification link');
      return;
    }
    api<OrderVerify>(`/v1/orders/verify?ref=${ref}&token=${token}`).then((res) => {
      if (res.data) setOrder(res.data);
      else setError(res.error || 'Order not found');
    });
  }, [ref, token]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <p className="text-aph-terracotta">{error}</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-aph-muted">Verifying order...</p>
      </div>
    );
  }

  const snapshot = order.snapshotJson;

  return (
    <div className="min-h-screen pt-24 pb-12 px-6">
      <div className="mx-auto max-w-lg">
        <div className="p-8 rounded-2xl bg-aph-card border border-aph-gold/20">
          <p className="text-aph-gold text-sm tracking-widest uppercase mb-2">Verified Order</p>
          <h1 className="font-[family-name:var(--font-display)] text-3xl mb-4">{order.orderRef}</h1>
          <p className="text-aph-muted mb-6">Status: <span className="text-aph-cream">{order.status}</span></p>
          <p className="mb-2"><strong>{order.customerName}</strong></p>
          <p className="text-aph-muted text-sm mb-6">{snapshot.address}</p>
          <ul className="space-y-2 mb-6 border-t border-aph-gold/10 pt-4">
            {snapshot.items.map((item, i) => (
              <li key={i} className="flex justify-between text-sm">
                <span>{item.name} ({item.weight}) × {item.quantity}</span>
                <span className="text-aph-gold">₹{item.lineTotal / 100}</span>
              </li>
            ))}
          </ul>
          <p className="text-xl font-medium text-aph-gold">Total: ₹{order.subtotalPaise / 100}</p>
          <p className="text-xs text-aph-muted mt-4">
            This is an immutable order snapshot. Tamper-proof reference locked at checkout.
          </p>
          <Link href="/" className="inline-block mt-6 text-aph-gold hover:underline">← Continue shopping</Link>
        </div>
      </div>
    </div>
  );
}

export default function OrderVerifyPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <VerifyContent />
    </Suspense>
  );
}
