'use client';

import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';
import { HeroVideo } from '../hero/HeroVideo';

const steps = [
  { step: '01', title: 'Select', desc: 'Hand-picked raw mangoes at peak tang' },
  { step: '02', title: 'Cut', desc: 'Traditional wedges — uniform, sun-ready' },
  { step: '03', title: 'Spice', desc: 'Roasted masala ground fresh each batch' },
  { step: '04', title: 'Cure', desc: '48 hours in cold-pressed sesame oil' },
  { step: '05', title: 'Seal', desc: 'Sterilized jars — Andhra gold inside' },
];

export function PreparationCinematic() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref });
  const progress = useTransform(scrollYProgress, [0, 1], [0, 1]);
  const videoScale = useTransform(scrollYProgress, [0, 1], [1.15, 1.05]);

  return (
    <section ref={ref} className="relative py-32 px-6 min-h-[90vh] overflow-hidden">
      <motion.div className="absolute inset-0" style={{ scale: videoScale }}>
        <HeroVideo
          src="/videos/hero-middle-frame.mp4"
          poster="https://images.unsplash.com/photo-1609501676725-7186f3e59e33?w=1920&q=80"
          crop="zoom-spice"
        />
      </motion.div>
      <div className="absolute inset-0 bg-aph-bg/88" />
      <div className="cinematic-grain absolute inset-0 opacity-50" />

      <motion.div
        className="absolute top-0 left-0 h-1 bg-aph-gold origin-left z-10"
        style={{ scaleX: progress, width: '100%' }}
      />

      <motion.div
        className="relative z-10 mx-auto max-w-4xl"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
      >
        <h2 className="font-[family-name:var(--font-display)] text-4xl md:text-5xl text-center mb-4">
          The Ritual of Pickling
        </h2>
        <p className="text-center text-aph-muted mb-20 max-w-lg mx-auto">
          Watch the craft unfold — from raw mango to sealed jar, every step blessed by Telugu tradition.
        </p>
        <div className="space-y-12">
          {steps.map((s, i) => (
            <motion.div
              key={s.step}
              className="flex gap-8 items-start"
              initial={{ opacity: 0, x: i % 2 === 0 ? -40 : 40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ duration: 0.6 }}
            >
              <span className="text-aph-gold font-[family-name:var(--font-display)] text-5xl opacity-50">
                {s.step}
              </span>
              <motion.div
                whileInView={{ borderColor: 'rgba(201, 162, 39, 0.5)' }}
                className="flex-1 border-l-2 border-aph-gold/20 pl-8 py-2"
              >
                <h3 className="text-2xl font-medium mb-2">{s.title}</h3>
                <p className="text-aph-muted">{s.desc}</p>
              </motion.div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </section>
  );
}
