'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { useStore } from '@/store/use-store';

export function StickyMobileCTA() {
  const { cart, setCartDrawerOpen } = useStore();
  const itemCount = cart?.itemCount ?? 0;
  const ctaClassName =
    'mx-auto flex w-full max-w-md items-center justify-center gap-2 rounded-full bg-aph-gold px-5 py-3 font-medium text-aph-bg shadow-lg glow-spice';

  return (
    <motion.div
      className="fixed inset-x-0 bottom-[calc(4.75rem+env(safe-area-inset-bottom))] z-50 p-4 md:hidden"
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      transition={{ delay: 1 }}
    >
      {itemCount > 0 ? (
        <button onClick={() => setCartDrawerOpen(true)} className={ctaClassName} data-cursor="hover">
          <span>View Cart</span>
          <span className="rounded-full bg-aph-bg px-2 py-0.5 text-sm text-aph-gold">
            {itemCount}
          </span>
        </button>
      ) : (
        <Link href="/shop" className={ctaClassName} data-cursor="hover">
          Order Pickles
        </Link>
      )}
    </motion.div>
  );
}
