'use client';

import Image from 'next/image';
import { motion } from 'framer-motion';

const ingredients = [
  {
    name: 'Raw Mango',
    note: 'Cut firm, sun-kissed, and naturally tangy.',
    img: 'https://images.unsplash.com/photo-1605027990121-c736661734de?auto=format&fit=crop&w=900&q=85',
  },
  {
    name: 'Red Chilli',
    note: 'Deep color and slow heat from dried chillies.',
    img: 'https://images.unsplash.com/photo-1596040033229-a0b4514a2f86?auto=format&fit=crop&w=900&q=85',
  },
  {
    name: 'Mustard',
    note: 'Freshly ground for the sharp Andhra bite.',
    img: 'https://images.unsplash.com/photo-1509358271058-acd22cc93898?auto=format&fit=crop&w=900&q=85',
  },
  {
    name: 'Cold-Pressed Oil',
    note: 'Sesame oil that carries spice into every piece.',
    img: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=900&q=85',
  },
];

export function IngredientsShowcase() {
  return (
    <section className="px-6 py-24">
      <div className="mx-auto max-w-6xl">
        <motion.div
          className="mb-12 max-w-2xl"
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <p className="mb-2 text-sm uppercase tracking-[0.3em] text-aph-gold">Ingredients</p>
          <h2 className="font-[family-name:var(--font-display)] text-4xl md:text-5xl">
            Real ingredients. Nothing decorative.
          </h2>
        </motion.div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {ingredients.map((item, index) => (
            <motion.article
              key={item.name}
              className="overflow-hidden rounded-xl border border-aph-border bg-aph-card"
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.06 }}
            >
              <div className="relative aspect-[4/3]">
                <Image src={item.img} alt={item.name} fill className="object-cover" sizes="(max-width: 768px) 50vw, 25vw" />
              </div>
              <div className="p-5">
                <h3 className="text-lg font-semibold text-aph-ink">{item.name}</h3>
                <p className="mt-2 text-sm leading-6 text-aph-muted">{item.note}</p>
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}
