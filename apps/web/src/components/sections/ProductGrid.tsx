'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ProductCard } from '../products/ProductCard';
import { useStore } from '@/store/use-store';
import { api } from '@/lib/api';
import type { PublicProduct } from '@aph/shared';
import { ProductSkeleton } from '../ui/ProductSkeleton';

export function ProductGrid() {
  const storeProducts = useStore((s) => s.products);
  const setProducts = useStore((s) => s.setProducts);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const products = storeProducts;

  useEffect(() => {
    if (storeProducts.length) return;
    setLoading(true);
    api<PublicProduct[]>('/v1/products')
      .then((res) => {
        if (res.data) {
          setProducts(res.data);
          setError(null);
          return;
        }

        setError(res.error ?? 'No products were returned by the API.');
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Unable to load products.');
      })
      .finally(() => setLoading(false));
  }, [setProducts, storeProducts.length]);

  return (
    <section id="products" className="py-24 px-6">
      <motion.div
        className="text-center mb-16"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
      >
        <p className="text-aph-gold text-sm tracking-[0.3em] uppercase mb-2">Our Collection</p>
        <h2 className="font-[family-name:var(--font-display)] text-4xl md:text-5xl">
          Premium Andhra Pickles
        </h2>
      </motion.div>
      {loading ? (
        <div className="mx-auto grid max-w-6xl gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <ProductSkeleton key={i} />
          ))}
        </div>
      ) : products.length ? (
        <motion.div className="mx-auto grid max-w-6xl gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {products.slice(0, 6).map((p, i) => (
            <ProductCard key={p.id} product={p} index={i} />
          ))}
        </motion.div>
      ) : (
        <div className="mx-auto max-w-2xl text-center text-aph-muted">
          <p>Products are not available yet. Run the seed or check the API connection.</p>
          {error ? <p className="mt-3 text-sm text-red-300">{error}</p> : null}
        </div>
      )}
    </section>
  );
}
