'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { useStore } from '@/store/use-store';
import { api } from '@/lib/api';
import { FALLBACK_PRODUCT_IMAGE, productImageUrl } from '@/lib/images';
import { MagneticButton } from '../ui/MagneticButton';

function CartItemImage({ slug, imageUrl, name }: { slug?: string; imageUrl?: string; name?: string }) {
  const [src, setSrc] = useState(() => productImageUrl(slug, imageUrl));

  return (
    <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg border border-aph-border bg-aph-surface sm:h-24 sm:w-24">
      <Image
        src={src}
        alt={name ? `${name} pickle jar` : 'Pickle product thumbnail'}
        fill
        className="object-cover"
        sizes="96px"
        onError={() => setSrc(FALLBACK_PRODUCT_IMAGE)}
      />
    </div>
  );
}

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
            className="absolute right-0 top-0 flex h-full w-full max-w-md flex-col border-l border-aph-gold/20 bg-aph-card pb-[env(safe-area-inset-bottom)] shadow-2xl"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25 }}
          >
            <div className="flex items-center justify-between border-b border-aph-gold/10 p-4 sm:p-6">
              <h2 className="font-[family-name:var(--font-display)] text-2xl">
                {checkoutStep ? 'Checkout' : 'Your Cart'}
              </h2>
              <button
                type="button"
                onClick={() => setCartDrawerOpen(false)}
                className="grid size-9 place-items-center rounded-full border border-aph-border text-aph-muted transition hover:text-aph-ink"
                aria-label="Close cart"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 sm:p-6">
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
                  <div key={item.id} className="mb-5 flex min-w-0 gap-3 border-b border-aph-gold/10 pb-5 sm:gap-4">
                    <CartItemImage slug={item.slug} imageUrl={item.imageUrl} name={item.name} />
                    <div className="min-w-0 flex-1">
                      <h4 className="truncate font-medium">{item.name || 'Andhra Pickle'}</h4>
                      <p className="text-aph-muted text-sm">{item.weightLabel}</p>
                      <div className="mt-3 flex items-center justify-between gap-3">
                        <motion.div className="flex items-center gap-2 rounded-full border border-aph-border px-2 py-1">
                          <button type="button" onClick={() => updateQty(item.id, item.quantity - 1)} className="grid size-7 place-items-center rounded-full text-aph-gold">−</button>
                          <span className="min-w-5 text-center text-sm">{item.quantity}</span>
                          <button type="button" onClick={() => updateQty(item.id, item.quantity + 1)} className="grid size-7 place-items-center rounded-full text-aph-gold">+</button>
                        </motion.div>
                        <span className="shrink-0 text-aph-gold">₹{item.lineTotal / 100}</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {orderPlaced ? (
              <div className="border-t border-aph-gold/10 p-4 sm:p-6">
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
              <div className="border-t border-aph-gold/10 p-4 sm:p-6">
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
