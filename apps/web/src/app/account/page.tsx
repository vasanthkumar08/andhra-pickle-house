'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { api } from '@/lib/api';
import { useStore } from '@/store/use-store';

interface OrderRow {
  id: string;
  orderRef: string;
  status: string;
  subtotalPaise: number;
  createdAt: string;
}

export default function AccountPage() {
  const { user, openAuthModal } = useStore();
  const [orders, setOrders] = useState<OrderRow[]>([]);

  useEffect(() => {
    if (!user) return;
    api<OrderRow[]>('/v1/orders/my').then((res) => {
      if (res.data) setOrders(res.data);
    });
  }, [user]);

  if (!user) {
    return (
      <main className="min-h-screen pt-24 px-6 text-center">
        <button type="button" onClick={() => openAuthModal()} className="text-aph-gold underline">
          Login to view account
        </button>
      </main>
    );
  }

  return (
    <main className="min-h-screen pt-24 pb-16 px-6 bg-aph-bg">
      <motion.div className="mx-auto max-w-2xl" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-[family-name:var(--font-display)] text-3xl mb-2">My Account</h1>
        <p className="text-aph-muted mb-8">+{user.phone}</p>

        <section className="glass-card rounded-2xl p-6">
          <h2 className="font-medium mb-4">Order history</h2>
          {orders.length === 0 ? (
            <p className="text-aph-muted text-sm">No orders yet.</p>
          ) : (
            <ul className="space-y-3">
              {orders.map((o) => (
                <li key={o.id} className="flex justify-between items-center border-b border-aph-border pb-3 last:border-0">
                  <div>
                    <p className="font-medium text-aph-gold">{o.orderRef}</p>
                    <p className="text-xs text-aph-muted">{new Date(o.createdAt).toLocaleString('en-IN')}</p>
                  </div>
                  <div className="text-right text-sm">
                    <p>{o.status}</p>
                    <p>₹{o.subtotalPaise / 100}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <div className="flex gap-4 mt-6 text-sm">
          <Link href="/wishlist" className="text-aph-gold hover:underline">Wishlist</Link>
          <Link href="/shop" className="text-aph-gold hover:underline">Shop</Link>
        </div>
      </motion.div>
    </main>
  );
}
