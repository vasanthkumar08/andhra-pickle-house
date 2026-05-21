'use client';

import Image from 'next/image';
import { motion } from 'framer-motion';
import { STORY_IMAGES } from '@/lib/images';

const ingredients = [
  {
    name: 'Raw Mango',
    note: 'Cut firm, sun-kissed, and naturally tangy.',
    img: STORY_IMAGES.mangoes,
  },
  {
    name: 'Red Chilli',
    note: 'Deep color and slow heat from dried chillies.',
    img: STORY_IMAGES.chillies,
  },
  {
    name: 'Mustard',
    note: 'Freshly ground for the sharp Andhra bite.',
    img: STORY_IMAGES.mustard,
  },
  {
    name: 'Cold-Pressed Oil',
    note: 'Sesame oil that carries spice into every piece.',
    img: STORY_IMAGES.oil,
  },
];

export function IngredientsShowcase() {
  return (
    <section className="px-4 py-20 sm:px-6 sm:py-24">
      <div className="mx-auto max-w-6xl">
        <motion.div
          className="mb-12 max-w-2xl"
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <p className="mb-2 text-sm uppercase tracking-[0.3em] text-aph-gold">Ingredients</p>
          <h2 className="font-[family-name:var(--font-display)] text-3xl leading-tight md:text-4xl">
            Real pickle ingredients.
          </h2>
        </motion.div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {ingredients.map((item, index) => (
            <motion.article
              key={item.name}
              className="overflow-hidden rounded-xl border border-aph-border bg-aph-card shadow-sm"
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.06 }}
            >
              <div className="relative aspect-[4/3]">
                <Image
                  src={item.img}
                  alt={item.name}
                  fill
                  className="object-cover transition-transform duration-700 hover:scale-105"
                  sizes="(max-width: 768px) 50vw, 25vw"
                />
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
