'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { api } from '@/lib/api';
import Link from 'next/link';

interface Analytics {
  totalOrders: number;
  revenuePaise: number;
  pendingOrders: number;
  repeatCustomerCount: number;
  topProducts: Array<{ productName: string; _sum: { quantity: number | null } }>;
}

interface Order {
  id: string;
  orderRef: string;
  status: string;
  subtotalPaise: number;
  customerName: string;
  createdAt: string;
  items: Array<{ productName: string; quantity: number }>;
}

export default function AdminPage() {
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([
      api<Analytics>('/v1/admin/analytics'),
      api<{ orders: Order[] }>('/v1/admin/orders'),
    ]).then(([aRes, oRes]) => {
      if (!aRes.success) setError('Admin access required. Login with admin phone.');
      else setAnalytics(aRes.data!);
      if (oRes.data) setOrders(oRes.data.orders);
    });
  }, []);

  const updateStatus = async (id: string, status: string) => {
    await api(`/v1/admin/orders/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
    const oRes = await api<{ orders: Order[] }>('/v1/admin/orders');
    if (oRes.data) setOrders(oRes.data.orders);
  };

  if (error) {
    return (
      <motion.div className="min-h-screen flex items-center justify-center p-6">
        <div className="text-center">
          <p className="text-aph-terracotta mb-4">{error}</p>
          <Link href="/" className="text-aph-gold hover:underline">← Back to store</Link>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="min-h-screen bg-aph-bg pt-24 pb-12 px-6">
      <div className="mx-auto max-w-6xl">
        <motion.div
          className="flex items-center justify-between mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="font-[family-name:var(--font-display)] text-3xl">Admin Dashboard</h1>
          <Link href="/" className="text-aph-gold text-sm hover:underline">← Store</Link>
        </motion.div>

        {analytics && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
            {[
              { label: 'Total Orders', value: analytics.totalOrders },
              { label: 'Revenue', value: `₹${(analytics.revenuePaise / 100).toLocaleString('en-IN')}` },
              { label: 'Pending', value: analytics.pendingOrders },
              { label: 'Repeat Customers', value: analytics.repeatCustomerCount },
            ].map((s) => (
              <div key={s.label} className="p-6 rounded-xl bg-aph-card border border-aph-gold/10">
                <p className="text-aph-muted text-sm">{s.label}</p>
                <p className="text-2xl font-medium text-aph-gold mt-1">{s.value}</p>
              </div>
            ))}
          </div>
        )}

        <section className="mb-10">
          <h2 className="text-xl font-medium mb-4">Top Products</h2>
          <motion.div className="rounded-xl bg-aph-card border border-aph-gold/10 overflow-hidden">
            {analytics?.topProducts.map((p) => (
              <div key={p.productName} className="flex justify-between px-4 py-3 border-b border-aph-gold/5 last:border-0">
                <span>{p.productName}</span>
                <span className="text-aph-gold">{p._sum.quantity} sold</span>
              </div>
            ))}
          </motion.div>
        </section>

        <section>
          <h2 className="text-xl font-medium mb-4">Orders</h2>
          <div className="space-y-3">
            {orders.map((order) => (
              <div key={order.id} className="p-4 rounded-xl bg-aph-card border border-aph-gold/10 flex flex-wrap gap-4 justify-between items-center">
                <div>
                  <p className="font-medium text-aph-gold">{order.orderRef}</p>
                  <p className="text-sm text-aph-muted">{order.customerName} · ₹{order.subtotalPaise / 100}</p>
                  <p className="text-xs text-aph-muted">{new Date(order.createdAt).toLocaleString('en-IN')}</p>
                </div>
                <select
                  value={order.status}
                  onChange={(e) => updateStatus(order.id, e.target.value)}
                  className="px-3 py-2 rounded-lg bg-aph-bg border border-aph-gold/20 text-sm"
                >
                  {['PENDING', 'CONFIRMED', 'PREPARING', 'SHIPPED', 'DELIVERED', 'CANCELLED'].map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
