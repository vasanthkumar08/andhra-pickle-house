'use client';

import { motion } from 'framer-motion';
import { useStore } from '@/store/use-store';

export function StickyMobileCTA() {
  const { cart, setCartDrawerOpen } = useStore();

  return (
    <motion.div
      className="fixed bottom-0 left-0 right-0 z-50 md:hidden p-4 bg-gradient-to-t from-aph-bg via-aph-bg/95 to-transparent"
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      transition={{ delay: 1 }}
    >
      <button
        onClick={() => setCartDrawerOpen(true)}
        className="w-full py-4 rounded-full bg-aph-gold text-aph-bg font-medium flex items-center justify-center gap-2 shadow-lg glow-spice"
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
