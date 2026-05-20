'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '@/lib/api';

interface Testimonial {
  id: string;
  name: string;
  location?: string;
  reviewEn: string;
  reviewTe?: string;
  rating: number;
}

export function Testimonials() {
  const [items, setItems] = useState<Testimonial[]>([]);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    api<Testimonial[]>('/v1/content/testimonials').then((res) => {
      if (res.data) setItems(res.data);
    });
  }, []);

  useEffect(() => {
    if (!items.length) return;
    const t = setInterval(() => setIndex((i) => (i + 1) % items.length), 6000);
    return () => clearInterval(t);
  }, [items.length]);

  const current = items[index];

  return (
    <section className="py-24 px-6 bg-aph-surface/30 overflow-hidden">
      <motion.h2
        className="font-[family-name:var(--font-display)] text-4xl text-center mb-16"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
      >
        Voices from Our Family
      </motion.h2>

      <div className="mx-auto max-w-3xl min-h-[280px] relative">
        <AnimatePresence mode="wait">
          {current && (
            <motion.blockquote
              key={current.id}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.5 }}
              className="text-center px-4"
            >
              <div className="flex justify-center gap-1 mb-6">
                {Array.from({ length: current.rating }).map((_, i) => (
                  <span key={i} className="text-aph-gold">★</span>
                ))}
              </div>
              <p className="text-xl md:text-2xl leading-relaxed mb-4 font-[family-name:var(--font-display)] italic">
                &ldquo;{current.reviewEn}&rdquo;
              </p>
              {current.reviewTe && (
                <p className="font-[family-name:var(--font-telugu)] text-aph-muted mb-6">
                  {current.reviewTe}
                </p>
              )}
              <footer>
                <cite className="not-italic font-medium text-aph-gold">{current.name}</cite>
                {current.location && (
                  <span className="text-aph-muted text-sm block">{current.location}</span>
                )}
              </footer>
            </motion.blockquote>
          )}
        </AnimatePresence>
      </div>

      <motion.div
        className="flex gap-4 overflow-x-auto pb-4 mt-12 px-6 snap-x max-w-6xl mx-auto"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
      >
        {items.map((t, i) => (
          <motion.button
            key={t.id}
            onClick={() => setIndex(i)}
            className={`snap-center shrink-0 w-72 p-4 rounded-xl border text-left transition-colors ${
              i === index ? 'border-aph-gold bg-aph-gold/10' : 'border-aph-muted/20 bg-aph-card'
            }`}
            whileHover={{ scale: 1.02 }}
            data-cursor="hover"
          >
            <p className="text-sm line-clamp-3 text-aph-muted">{t.reviewEn}</p>
            <p className="mt-2 text-aph-gold text-sm">{t.name}</p>
          </motion.button>
        ))}
      </motion.div>
    </section>
  );
}
