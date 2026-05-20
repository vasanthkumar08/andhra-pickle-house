'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import type { PublicProduct } from '@aph/shared';
import { api } from '@/lib/api';
import { ProductCard } from '@/components/products/ProductCard';
import { MagneticButton } from '@/components/ui/MagneticButton';
import { useStore } from '@/store/use-store';
import { useToast } from '@/components/providers/ToastProvider';
import { productImageUrl } from '@/lib/images';

export default function ProductDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const [product, setProduct] = useState<PublicProduct | null>(null);
  const [related, setRelated] = useState<PublicProduct[]>([]);
  const [weight, setWeight] = useState(250);
  const [qty, setQty] = useState(1);
  const { user, openAuthModal, setCart, setCartDrawerOpen } = useStore();
  const { toast } = useToast();

  useEffect(() => {
    if (!slug) return;
    api<PublicProduct>(`/v1/products/${slug}`).then((res) => {
      if (res.data) {
        setProduct(res.data);
        setWeight(res.data.variants[0]?.weightGrams ?? 250);
      }
    });
    api<PublicProduct[]>(`/v1/products/${slug}/related`).then((res) => {
      if (res.data) setRelated(res.data);
    });
  }, [slug]);

  const variant = product?.variants.find((v) => v.weightGrams === weight);

  const addToCart = async () => {
    if (!product) return;
    if (!user) {
      openAuthModal({ productId: product.id, weightGrams: weight, quantity: qty });
      return;
    }
    const res = await api('/v1/cart/items', {
      method: 'POST',
      body: JSON.stringify({ productId: product.id, weightGrams: weight, quantity: qty }),
    });
    if (res.data) {
      setCart(res.data as Parameters<typeof setCart>[0]);
      setCartDrawerOpen(true);
      toast('Added to cart', 'success');
    } else toast(res.error || 'Failed', 'error');
  };

  const toggleWishlist = async () => {
    if (!user || !product) {
      openAuthModal();
      return;
    }
    const res = await api('/v1/wishlist', {
      method: 'POST',
      body: JSON.stringify({ productId: product.id }),
    });
    toast(res.success ? 'Saved to wishlist' : res.error || 'Failed', res.success ? 'success' : 'error');
  };

  if (!product) {
    return (
      <div className="min-h-screen pt-24 flex items-center justify-center">
        <p className="animate-pulse text-aph-muted">Loading...</p>
      </div>
    );
  }

  const price = (variant?.priceInPaise ?? 0) / 100;
  const imageUrl = productImageUrl(product.slug, product.imageUrl);

  return (
    <main className="min-h-screen pt-24 pb-16 px-6 bg-aph-bg">
      <motion.div
        className="mx-auto max-w-6xl grid md:grid-cols-2 gap-12"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <motion.div className="relative aspect-square rounded-2xl overflow-hidden glass-card">
          <Image src={imageUrl} alt={product.name} fill className="object-cover" priority />
          {product.discountPercent ? (
            <span className="absolute top-4 left-4 bg-aph-terracotta text-white px-3 py-1 rounded-full text-sm">
              {product.discountPercent}% off
            </span>
          ) : null}
        </motion.div>

        <div>
          {product.nameTe && (
            <p className="font-[family-name:var(--font-telugu)] text-aph-gold">{product.nameTe}</p>
          )}
          <h1 className="font-[family-name:var(--font-display)] text-4xl text-aph-ink mt-1">{product.name}</h1>
          <div className="flex items-center gap-2 mt-2 text-sm text-aph-muted">
            <span>★ {product.rating?.toFixed(1)}</span>
            <span>({product.reviewsCount} reviews)</span>
          </div>
          <p className="mt-4 text-aph-muted leading-relaxed">{product.description}</p>
          {product.ingredients && (
            <p className="mt-3 text-sm text-aph-muted">
              <strong className="text-aph-ink">Ingredients:</strong> {product.ingredients}
            </p>
          )}

          <div className="flex flex-wrap gap-2 mt-6">
            {product.variants.map((v) => (
              <button
                key={v.weightGrams}
                type="button"
                onClick={() => setWeight(v.weightGrams)}
                className={`px-4 py-2 rounded-full border text-sm ${
                  weight === v.weightGrams ? 'border-aph-gold bg-aph-gold/10 text-aph-gold' : 'border-aph-border'
                }`}
              >
                {v.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-4 mt-6">
            <div className="flex items-center border border-aph-border rounded-full px-2">
              <button type="button" onClick={() => setQty((q) => Math.max(1, q - 1))} className="w-9 h-9">−</button>
              <span className="w-8 text-center">{qty}</span>
              <button type="button" onClick={() => setQty((q) => q + 1)} className="w-9 h-9">+</button>
            </div>
            <span className="text-3xl font-medium text-aph-gold">₹{price}</span>
          </div>

          <div className="flex gap-3 mt-8">
            <MagneticButton onClick={addToCart} className="flex-1">
              Add to Cart
            </MagneticButton>
            <MagneticButton variant="outline" onClick={toggleWishlist}>
              ♥ Wishlist
            </MagneticButton>
          </div>

          <Link href="/shop" className="inline-block mt-6 text-sm text-aph-gold hover:underline">
            ← Back to shop
          </Link>
        </div>
      </motion.div>

      {related.length > 0 && (
        <section className="mx-auto max-w-6xl mt-20">
          <h2 className="font-[family-name:var(--font-display)] text-2xl mb-8">You may also love</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {related.map((p, i) => (
              <Link key={p.id} href={`/products/${p.slug}`}>
                <ProductCard product={p} index={i} />
              </Link>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
