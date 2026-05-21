'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { MagneticButton } from '../ui/MagneticButton';
import { HeroVideo } from './HeroVideo';

const heroStats = [
  ['12+', 'Small-batch recipes'],
  ['48h', 'Slow curing'],
  ['1962', 'Family tradition'],
];

export function CinematicHero() {
  return (
    <section className="relative min-h-[calc(100vh-5rem)] overflow-hidden border-b border-aph-gold/15">
      <HeroVideo
        src="/videos/hero-first-frame.mp4"
        poster="/images/pickle-kitchen.svg"
        crop="center"
        priority
      />
      <div className="absolute inset-0 bg-gradient-to-r from-aph-bg/35 via-aph-bg/12 to-transparent dark:from-aph-bg/88 dark:via-aph-bg/58 dark:to-aph-bg/18" />
      <div className="absolute inset-0 bg-gradient-to-t from-aph-bg/38 via-transparent to-aph-bg/10 dark:from-aph-bg/88 dark:to-aph-bg/42" />
      <div className="cinematic-grain absolute inset-0" />

      <div className="relative z-10 mx-auto flex min-h-[calc(100vh-5rem)] max-w-7xl items-center px-6 py-24">
        <div className="max-w-3xl">
          <motion.p
            className="mb-5 text-sm uppercase tracking-[0.32em] text-aph-gold"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55 }}
          >
            Andhra homemade pickles
          </motion.p>

          <motion.h1
            className="font-[family-name:var(--font-display)] text-5xl font-light leading-[0.95] text-aph-cream drop-shadow-[0_2px_18px_rgba(250,248,245,0.55)] md:text-6xl lg:text-7xl"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.75, delay: 0.08 }}
          >
            Real Andhra pickles, sealed fresh in every jar.
          </motion.h1>

          <motion.p
            className="mt-7 max-w-2xl text-lg leading-8 text-aph-muted md:text-xl"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.18 }}
          >
            Sun-dried mangoes, hand-ground spices, cold-pressed oil, and the kind of slow curing
            that tastes like home.
          </motion.p>

          <motion.div
            className="mt-9 flex flex-wrap gap-4"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, delay: 0.28 }}
          >
            <Link href="/shop">
              <MagneticButton size="lg">Shop Pickles</MagneticButton>
            </Link>
            <MagneticButton
              variant="outline"
              size="lg"
              onClick={() => document.getElementById('products')?.scrollIntoView({ behavior: 'smooth' })}
            >
              Taste Bestsellers
            </MagneticButton>
          </motion.div>

          <motion.div
            className="mt-12 grid max-w-2xl grid-cols-3 gap-4 border-t border-aph-gold/15 pt-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.7, delay: 0.42 }}
          >
            {heroStats.map(([value, label]) => (
              <div key={value}>
                <p className="font-[family-name:var(--font-display)] text-3xl text-aph-gold">{value}</p>
                <p className="mt-1 text-xs uppercase tracking-widest text-aph-muted">{label}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
