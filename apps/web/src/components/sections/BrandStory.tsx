'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import { SplitText } from '../ui/SplitText';

export function BrandStory() {
  return (
    <section id="story" className="relative py-32 px-6">
      <motion.div
        className="mx-auto max-w-6xl grid md:grid-cols-2 gap-16 items-center"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true, margin: '-100px' }}
      >
        <div className="relative aspect-[4/5] overflow-hidden rounded-2xl">
          <Image
            src="/images/pickle-kitchen.svg"
            alt="Illustrated Andhra pickle kitchen with jars, mangoes, spices, and oil"
            fill
            unoptimized
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 50vw"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-aph-bg via-transparent to-transparent" />
        </div>
        <motion.div
          initial={{ x: 40, opacity: 0 }}
          whileInView={{ x: 0, opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <p className="text-aph-gold text-sm tracking-[0.3em] uppercase mb-4">Since 1962</p>
          <h2 className="font-[family-name:var(--font-display)] text-4xl md:text-5xl font-light mb-6">
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
