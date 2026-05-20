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
        poster="https://images.unsplash.com/photo-1609501676725-7186f3e59e33?auto=format&fit=crop&w=1800&q=90"
        crop="center"
        priority
      />
      <div className="absolute inset-0 bg-gradient-to-r from-aph-bg/85 via-aph-bg/52 to-aph-bg/10 dark:from-aph-bg/95 dark:via-aph-bg/70 dark:to-aph-bg/25" />
      <div className="absolute inset-0 bg-gradient-to-t from-aph-bg/72 via-transparent to-aph-bg/28 dark:from-aph-bg dark:to-aph-bg/55" />
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
            className="font-[family-name:var(--font-display)] text-5xl font-light leading-[0.95] text-aph-cream md:text-7xl lg:text-8xl"
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
