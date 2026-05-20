'use client';

import { motion } from 'framer-motion';

export function TeluguHeritage() {
  return (
    <section className="py-32 px-6 relative overflow-hidden">
      <motion.div
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23c9a227' fill-opacity='0.15'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />
      <motion.div
        className="relative mx-auto max-w-4xl text-center"
        initial={{ opacity: 0, scale: 0.95 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
      >
        <p className="font-[family-name:var(--font-telugu)] text-3xl text-aph-gold mb-6">
          తెలుగు కుటుంబ వంశపారంపర్య రుచులు
        </p>
        <h2 className="font-[family-name:var(--font-display)] text-4xl md:text-5xl mb-6">
          Made by Telugu Family Recipes
        </h2>
        <p className="text-aph-muted text-lg max-w-2xl mx-auto">
          Every jar carries the warmth of our kitchen — the same recipes our ammamma guarded,
          the same spices our mother measured by hand, the same love we now share with your family.
        </p>
      </motion.div>
    </section>
  );
}
