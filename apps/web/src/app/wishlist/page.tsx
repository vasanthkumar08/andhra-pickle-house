'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import type { PublicProduct } from '@aph/shared';
import { api } from '@/lib/api';
import { ProductCard } from '@/components/products/ProductCard';
import { useStore } from '@/store/use-store';

interface WishlistRow {
  id: string;
  product?: PublicProduct;
}

export default function WishlistPage() {
  const { user, openAuthModal } = useStore();
  const [items, setItems] = useState<WishlistRow[]>([]);

  useEffect(() => {
    if (!user) return;
    api<WishlistRow[]>('/v1/wishlist').then((res) => {
      if (res.data) setItems(res.data);
    });
  }, [user]);

  if (!user) {
    return (
      <main className="min-h-screen pt-24 px-6 text-center">
        <p className="text-aph-muted mb-4">Login to view your wishlist</p>
        <button type="button" onClick={() => openAuthModal()} className="text-aph-gold underline">
          Login with OTP
        </button>
      </main>
    );
  }

  return (
    <main className="min-h-screen pt-24 pb-16 px-6">
      <motion.div className="mx-auto max-w-6xl" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <h1 className="font-[family-name:var(--font-display)] text-3xl mb-8">Wishlist</h1>
        {items.length === 0 ? (
          <p className="text-aph-muted">
            No saved items. <Link href="/shop" className="text-aph-gold">Browse shop</Link>
          </p>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {items.map((row, i) =>
              row.product ? (
                <Link key={row.id} href={`/products/${row.product.slug}`}>
                  <ProductCard product={row.product} index={i} />
                </Link>
              ) : null
            )}
          </div>
        )}
      </motion.div>
    </main>
  );
}
