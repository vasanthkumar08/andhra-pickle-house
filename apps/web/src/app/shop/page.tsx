'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import type { CatalogResponse, PublicProduct } from '@aph/shared';
import { api } from '@/lib/api';
import { ProductCard } from '@/components/products/ProductCard';
import { ProductSkeleton } from '@/components/ui/ProductSkeleton';

export default function ShopPage() {
  const [data, setData] = useState<CatalogResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [q, setQ] = useState('');
  const [sort, setSort] = useState<string>('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    if (sort) params.set('sort', sort);
    params.set('limit', '12');
    const res = await api<CatalogResponse | PublicProduct[]>(`/v1/products?${params}`);
    if (Array.isArray(res.data)) {
      setData({
        items: res.data,
        total: res.data.length,
        page: 1,
        limit: res.data.length,
        totalPages: 1,
      });
    } else if (res.data) {
      setData(res.data);
    } else {
      setData(null);
      setError(res.error || 'Unable to load products right now.');
    }
    setLoading(false);
  }, [q, sort]);

  useEffect(() => {
    const t = setTimeout(load, 300);
    return () => clearTimeout(t);
  }, [load]);

  return (
    <main className="min-h-screen bg-aph-bg px-4 pb-24 pt-24 sm:px-6">
      <motion.div
        className="mx-auto max-w-6xl"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="mb-10 flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div className="min-w-0">
            <p className="text-aph-gold text-sm tracking-widest uppercase mb-1">Shop</p>
            <h1 className="font-[family-name:var(--font-display)] text-4xl leading-tight text-aph-ink">
              Premium Andhra Pickles
            </h1>
          </div>
          <div className="flex w-full flex-col gap-3 sm:flex-row md:w-auto">
            <input
              type="search"
              placeholder="Search pickles..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="w-full rounded-full border border-aph-border bg-aph-surface px-4 py-2 text-aph-ink outline-none placeholder:text-aph-muted/55 focus:border-aph-gold dark:bg-aph-card dark:text-aph-cream dark:placeholder:text-aph-muted sm:w-56"
            />
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="w-full rounded-full border border-aph-border bg-aph-surface px-4 py-2 text-aph-ink outline-none focus:border-aph-gold dark:bg-aph-card dark:text-aph-cream sm:w-auto"
            >
              <option value="">Sort</option>
              <option value="rating">Top rated</option>
              <option value="price_asc">Price: Low</option>
              <option value="price_desc">Price: High</option>
              <option value="newest">Newest</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 lg:gap-8">
            {Array.from({ length: 6 }).map((_, i) => (
              <ProductSkeleton key={i} />
            ))}
          </div>
        ) : (
          <>
            <p className="text-aph-muted text-sm mb-6">{data?.total ?? 0} products</p>
            {error ? (
              <div className="rounded-2xl border border-aph-border bg-aph-surface p-6 text-aph-muted dark:bg-aph-card">
                <p>{error}</p>
                <button
                  type="button"
                  onClick={load}
                  className="mt-4 rounded-full bg-aph-gold px-5 py-2 text-sm font-medium text-aph-bg transition hover:bg-aph-gold-light"
                >
                  Retry
                </button>
              </div>
            ) : (
              <motion.div
                className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 lg:gap-8"
                initial="hidden"
                animate="visible"
                variants={{ visible: { transition: { staggerChildren: 0.06 } } }}
              >
                {(data?.items ?? []).map((p: PublicProduct, i: number) => (
                  <Link key={p.id} href={`/products/${p.slug}`}>
                    <ProductCard product={p} index={i} />
                  </Link>
                ))}
              </motion.div>
            )}
          </>
        )}
      </motion.div>
    </main>
  );
}
