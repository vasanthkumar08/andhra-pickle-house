'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import { SplitText } from '../ui/SplitText';
import { STORY_IMAGES } from '@/lib/images';

export function BrandStory() {
  return (
    <section id="story" className="relative px-4 py-24 sm:px-6 sm:py-32">
      <motion.div
        className="mx-auto grid max-w-6xl items-center gap-10 md:grid-cols-2 md:gap-16"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true, margin: '-100px' }}
      >
        <div className="relative aspect-[4/5] overflow-hidden rounded-2xl border border-aph-border bg-aph-surface shadow-xl">
          <Image
            src={STORY_IMAGES.kitchen}
            alt="Traditional homemade Indian pickle preparation with jars and ingredients"
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 50vw"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-aph-bg/80 via-transparent to-transparent" />
        </div>
        <motion.div
          initial={{ x: 40, opacity: 0 }}
          whileInView={{ x: 0, opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <p className="text-aph-gold text-sm tracking-[0.3em] uppercase mb-4">Since 1962</p>
          <h2 className="mb-6 font-[family-name:var(--font-display)] text-4xl font-light leading-tight md:text-5xl">
            <SplitText text="A Telugu Kitchen. A Sacred Ritual." />
          </h2>
          <p className="text-aph-muted leading-relaxed mb-4">
            In a small village near Vijayawada, our ammamma began making avakaya under the morning sun.
            Every summer, the terrace turned golden with mangoes — cut, salted, spiced, and sealed with love.
          </p>
          <p className="text-aph-muted leading-relaxed">
            Today, we carry that same ritual. No factories. No shortcuts. Only cold-pressed oils,
            sun-dried ingredients, and recipes whispered across three generations.
          </p>
        </motion.div>
      </motion.div>
    </section>
  );
}
