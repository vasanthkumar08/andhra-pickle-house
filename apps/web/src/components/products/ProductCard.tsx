'use client';

import { useEffect, useState } from 'react';
import type { MouseEvent } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import type { PublicProduct } from '@aph/shared';
import { MagneticButton } from '../ui/MagneticButton';
import { useStore } from '@/store/use-store';
import { api } from '@/lib/api';
import { FALLBACK_PRODUCT_IMAGE, productImageUrl } from '@/lib/images';

interface ProductCardProps {
  product: PublicProduct;
  index: number;
}

export function ProductCard({ product, index }: ProductCardProps) {
  const [weight, setWeight] = useState(product.variants[0]?.weightGrams ?? 250);
  const [quantity, setQuantity] = useState(1);
  const [adding, setAdding] = useState(false);
  const [imageSrc, setImageSrc] = useState(() => productImageUrl(product.slug, product.imageUrl));
  const { user, openAuthModal, setCart, setCartDrawerOpen } = useStore();

  const variant = product.variants.find((v) => v.weightGrams === weight) ?? product.variants[0];
  const price = variant ? variant.priceInPaise / 100 : 0;
  const inStock = variant ? variant.stock > 0 : false;

  useEffect(() => {
    setImageSrc(productImageUrl(product.slug, product.imageUrl));
  }, [product.slug, product.imageUrl]);

  const handleAdd = async (event?: MouseEvent) => {
    event?.preventDefault();
    event?.stopPropagation();
    if (!user) {
      openAuthModal({ productId: product.id, weightGrams: weight, quantity });
      return;
    }
    setAdding(true);
    const res = await api('/v1/cart/items', {
      method: 'POST',
      body: JSON.stringify({ productId: product.id, weightGrams: weight, quantity }),
    });
    if (res.data) {
      setCart(res.data as Parameters<typeof setCart>[0]);
      setCartDrawerOpen(true);
    }
    setAdding(false);
  };

  return (
    <motion.article
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.08 }}
      className="group relative overflow-hidden rounded-2xl border border-aph-border bg-aph-card shadow-[0_18px_45px_rgba(58,43,25,0.08)] transition-shadow duration-500 hover:glow-spice"
      data-cursor="hover"
    >
      <motion.div className="relative aspect-[4/3] overflow-hidden bg-gradient-to-br from-aph-surface via-aph-bg to-aph-gold/10">
        <Image
          src={imageSrc}
          alt={product.name}
          fill
          className="object-contain p-3 transition-transform duration-700 group-hover:scale-105"
          sizes="(max-width: 768px) 100vw, 33vw"
          priority={index < 3}
          onError={() => setImageSrc(FALLBACK_PRODUCT_IMAGE)}
        />
        <motion.div
          className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-aph-card via-aph-card/50 to-transparent"
        />
        <motion.div
          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
          style={{
            background: 'radial-gradient(circle at 50% 80%, rgba(201,162,39,0.2) 0%, transparent 60%)',
          }}
        />
        <div className="absolute top-4 right-4 flex gap-0.5">
          {Array.from({ length: product.spiceLevel }).map((_, i) => (
            <span key={i} className="text-aph-chilli text-sm">🌶</span>
          ))}
        </div>
        {product.nameTe && (
          <span className="absolute top-4 left-4 font-[family-name:var(--font-telugu)] text-aph-gold text-sm">
            {product.nameTe}
          </span>
        )}
      </motion.div>

      <motion.div className="p-6">
        <h3 className="font-[family-name:var(--font-display)] text-2xl mb-1">{product.name}</h3>
        <p className="text-aph-muted text-sm line-clamp-2 mb-4">{product.description}</p>

        <motion.div className="flex gap-2 mb-4 flex-wrap">
          {product.variants.map((v) => (
            <button
              key={v.weightGrams}
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                setWeight(v.weightGrams);
              }}
              className={`px-3 py-1 rounded-full text-sm border transition-colors ${
                weight === v.weightGrams
                  ? 'border-aph-gold bg-aph-gold/20 text-aph-gold'
                  : 'border-aph-muted/30 text-aph-muted hover:border-aph-gold/50'
              }`}
            >
              {v.label}
            </button>
          ))}
        </motion.div>

        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 border border-aph-muted/30 rounded-full px-2">
            <button
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                setQuantity((q) => Math.max(1, q - 1));
              }}
              className="w-8 h-8 flex items-center justify-center text-aph-gold"
            >
              −
            </button>
            <span className="w-6 text-center">{quantity}</span>
            <button
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                setQuantity((q) => Math.min(variant?.stock ?? 10, q + 1));
              }}
              className="w-8 h-8 flex items-center justify-center text-aph-gold"
            >
              +
            </button>
          </div>
          <span className="text-2xl font-medium text-aph-gold">₹{price}</span>
        </div>

        <MagneticButton
          className="w-full mt-4"
          onClick={handleAdd}
          disabled={!inStock || adding}
          data-cursor="hover"
        >
          {adding ? 'Adding...' : inStock ? 'Add to Cart' : 'Out of Stock'}
        </MagneticButton>
        {variant && variant.stock <= 5 && variant.stock > 0 && (
          <p className="text-xs text-aph-terracotta mt-2 text-center">Only {variant.stock} left!</p>
        )}
      </motion.div>
    </motion.article>
  );
}
