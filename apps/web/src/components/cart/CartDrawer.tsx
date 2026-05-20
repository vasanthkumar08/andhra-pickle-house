'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { useStore } from '@/store/use-store';
import { api } from '@/lib/api';
import { safeImageUrl } from '@/lib/images';
import { MagneticButton } from '../ui/MagneticButton';

export function CartDrawer() {
  const { cartDrawerOpen, setCartDrawerOpen, cart, setCart, user } = useStore();
  const [checkoutStep, setCheckoutStep] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checkoutError, setCheckoutError] = useState('');
  const [orderPlaced, setOrderPlaced] = useState<{ orderRef: string } | null>(null);
  const [form, setForm] = useState({
    customerName: user?.name || '',
    line1: '',
    city: '',
    state: 'Andhra Pradesh',
    pincode: '',
    phone: user?.phone?.slice(-10) || '',
    deliveryNotes: '',
  });

  const updateQty = async (itemId: string, quantity: number) => {
    const res = await api(`/v1/cart/items/${itemId}`, {
      method: 'PATCH',
      body: JSON.stringify({ quantity }),
    });
    if (res.data) setCart(res.data as Parameters<typeof setCart>[0]);
  };

  const handleCheckout = async () => {
    setLoading(true);
    setCheckoutError('');
    const res = await api<{ order: { orderRef: string } }>('/v1/orders/checkout', {
      method: 'POST',
      body: JSON.stringify({
        customerName: form.customerName,
        deliveryNotes: form.deliveryNotes,
        address: {
          line1: form.line1,
          city: form.city,
          state: form.state,
          pincode: form.pincode,
          phone: form.phone.length === 10 ? `91${form.phone}` : form.phone,
        },
      }),
    });
    setLoading(false);

    if (res.success && res.data?.order) {
      setCart(null);
      setOrderPlaced({ orderRef: res.data.order.orderRef });
    } else {
      setCheckoutError(res.error || 'Unable to place order');
    }
  };

  return (
    <AnimatePresence>
      {cartDrawerOpen && (
        <motion.div className="fixed inset-0 z-[90]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <div className="absolute inset-0 bg-black/60" onClick={() => setCartDrawerOpen(false)} />
          <motion.aside
            className="absolute right-0 top-0 h-full w-full max-w-md bg-aph-card border-l border-aph-gold/20 flex flex-col"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25 }}
          >
            <div className="p-6 border-b border-aph-gold/10 flex justify-between items-center">
              <h2 className="font-[family-name:var(--font-display)] text-2xl">
                {checkoutStep ? 'Checkout' : 'Your Cart'}
              </h2>
              <button onClick={() => setCartDrawerOpen(false)} className="text-aph-muted hover:text-aph-cream">✕</button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {orderPlaced ? (
                <div className="py-12 text-center">
                  <p className="text-aph-gold text-sm tracking-widest uppercase mb-2">Order received</p>
                  <p className="font-[family-name:var(--font-display)] text-3xl mb-3">{orderPlaced.orderRef}</p>
                  <p className="text-aph-muted text-sm">
                    Confirmation is being sent by our server. You can close this panel.
                  </p>
                </div>
              ) : !cart?.items.length ? (
                <p className="text-aph-muted text-center py-12">Your cart is empty</p>
              ) : checkoutStep ? (
                <div className="space-y-4">
                  <input
                    placeholder="Full Name"
                    value={form.customerName}
                    onChange={(e) => setForm({ ...form, customerName: e.target.value })}
                    className="w-full px-4 py-3 rounded-lg bg-aph-bg border border-aph-gold/20 outline-none"
                  />
                  <input
                    placeholder="Address Line"
                    value={form.line1}
                    onChange={(e) => setForm({ ...form, line1: e.target.value })}
                    className="w-full px-4 py-3 rounded-lg bg-aph-bg border border-aph-gold/20 outline-none"
                  />
                  <input
                    placeholder="City"
                    value={form.city}
                    onChange={(e) => setForm({ ...form, city: e.target.value })}
                    className="w-full px-4 py-3 rounded-lg bg-aph-bg border border-aph-gold/20 outline-none"
                  />
                  <input
                    placeholder="Pincode"
                    value={form.pincode}
                    onChange={(e) => setForm({ ...form, pincode: e.target.value })}
                    className="w-full px-4 py-3 rounded-lg bg-aph-bg border border-aph-gold/20 outline-none"
                    maxLength={6}
                  />
                  <textarea
                    placeholder="Delivery notes (optional)"
                    value={form.deliveryNotes}
                    onChange={(e) => setForm({ ...form, deliveryNotes: e.target.value })}
                    className="w-full px-4 py-3 rounded-lg bg-aph-bg border border-aph-gold/20 outline-none h-20 resize-none"
                  />
                  <p className="text-xs text-aph-muted">
                    Order will be locked with a secure reference. Confirmation is handled by the server.
                  </p>
                  {checkoutError && <p className="text-sm text-aph-terracotta">{checkoutError}</p>}
                </div>
              ) : (
                cart.items.map((item) => (
                  <div key={item.id} className="flex gap-4 mb-6 pb-6 border-b border-aph-gold/10">
                    {item.imageUrl && (
                      <div className="relative w-20 h-20 rounded-lg overflow-hidden shrink-0">
                        <Image src={safeImageUrl(item.imageUrl)} alt={item.name || ''} fill className="object-cover" />
                      </div>
                    )}
                    <div className="flex-1">
                      <h4 className="font-medium">{item.name}</h4>
                      <p className="text-aph-muted text-sm">{item.weightLabel}</p>
                      <div className="flex items-center justify-between mt-2">
                        <motion.div className="flex gap-2">
                          <button onClick={() => updateQty(item.id, item.quantity - 1)} className="w-7 h-7 border rounded">−</button>
                          <span>{item.quantity}</span>
                          <button onClick={() => updateQty(item.id, item.quantity + 1)} className="w-7 h-7 border rounded">+</button>
                        </motion.div>
                        <span className="text-aph-gold">₹{item.lineTotal / 100}</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {orderPlaced ? (
              <div className="p-6 border-t border-aph-gold/10">
                <MagneticButton
                  className="w-full"
                  onClick={() => {
                    setOrderPlaced(null);
                    setCheckoutStep(false);
                    setCartDrawerOpen(false);
                  }}
                >
                  Done
                </MagneticButton>
              </div>
            ) : cart && cart.items.length > 0 ? (
              <div className="p-6 border-t border-aph-gold/10">
                <div className="flex justify-between mb-4 text-lg">
                  <span>Total</span>
                  <span className="text-aph-gold font-medium">₹{cart.subtotal / 100}</span>
                </div>
                {checkoutStep ? (
                  <MagneticButton className="w-full" onClick={handleCheckout} disabled={loading}>
                    {loading ? 'Placing Order...' : 'Confirm via WhatsApp'}
                  </MagneticButton>
                ) : (
                  <MagneticButton className="w-full" onClick={() => setCheckoutStep(true)}>
                    Proceed to Checkout
                  </MagneticButton>
                )}
              </div>
            ) : null}
          </motion.aside>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
