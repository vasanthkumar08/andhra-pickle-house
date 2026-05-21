'use client';

import { motion } from 'framer-motion';
import { useStore } from '@/store/use-store';

export function StickyMobileCTA() {
  const { cart, setCartDrawerOpen } = useStore();

  return (
    <motion.div
      className="fixed inset-x-0 bottom-[calc(4.75rem+env(safe-area-inset-bottom))] z-50 p-4 md:hidden"
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      transition={{ delay: 1 }}
    >
      <button
        onClick={() => setCartDrawerOpen(true)}
        className="mx-auto flex w-full max-w-md items-center justify-center gap-2 rounded-full bg-aph-gold px-5 py-3 font-medium text-aph-bg shadow-lg glow-spice"
        data-cursor="hover"
      >
        <span>Order Pickles</span>
        {cart && cart.itemCount > 0 && (
          <span className="bg-aph-bg text-aph-gold rounded-full px-2 py-0.5 text-sm">
            {cart.itemCount}
          </span>
        )}
      </button>
    </motion.div>
  );
}
