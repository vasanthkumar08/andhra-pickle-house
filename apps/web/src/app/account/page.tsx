'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { LogOut, ShoppingBag, UserCircle } from 'lucide-react';
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
  const { user, openAuthModal, logoutLocal } = useStore();
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    if (!user) return;
    api<OrderRow[]>('/v1/orders/my').then((res) => {
      if (res.data) setOrders(res.data);
    });
  }, [user]);

  const logout = async () => {
    if (loggingOut) return;
    setLoggingOut(true);
    logoutLocal();
    try {
      await api('/v1/auth/logout', { method: 'POST' });
    } finally {
      setLoggingOut(false);
    }
  };

  if (!user) {
    return (
      <main className="min-h-screen px-4 pt-28 text-center sm:px-6">
        <button type="button" onClick={() => openAuthModal()} className="rounded-full bg-aph-gold px-5 py-3 text-sm font-medium text-aph-bg">
          Login to view account
        </button>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-aph-bg px-4 pb-28 pt-24 sm:px-6">
      <motion.div className="mx-auto max-w-2xl" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <p className="mb-2 inline-flex items-center gap-2 rounded-full border border-aph-border px-3 py-1 text-sm text-aph-muted">
              <UserCircle size={16} /> Signed in
            </p>
            <h1 className="font-[family-name:var(--font-display)] text-3xl">My Account</h1>
          </div>
          <button
            type="button"
            onClick={logout}
            disabled={loggingOut}
            className="inline-flex w-fit items-center gap-2 rounded-full border border-aph-border px-4 py-2 text-sm text-aph-terracotta transition hover:bg-aph-terracotta/10 disabled:opacity-60"
          >
            <LogOut size={16} /> {loggingOut ? 'Signing out...' : 'Logout'}
          </button>
        </div>

        <section className="glass-card rounded-2xl p-6">
          <h2 className="mb-4 inline-flex items-center gap-2 font-medium"><ShoppingBag size={17} /> Order history</h2>
          {orders.length === 0 ? (
            <p className="text-aph-muted text-sm">No orders yet.</p>
          ) : (
            <ul className="space-y-3">
              {orders.map((o) => (
                <li key={o.id} className="flex min-w-0 items-center justify-between gap-3 border-b border-aph-border pb-3 last:border-0">
                  <div className="min-w-0">
                    <p className="font-medium text-aph-gold">{o.orderRef}</p>
                    <p className="truncate text-xs text-aph-muted">{new Date(o.createdAt).toLocaleString('en-IN')}</p>
                  </div>
                  <div className="shrink-0 text-right text-sm">
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
