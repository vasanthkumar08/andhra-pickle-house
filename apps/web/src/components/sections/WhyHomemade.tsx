'use client';

import { motion } from 'framer-motion';

const benefits = [
  { title: 'No Preservatives', desc: 'Pure ingredients — nothing you cannot pronounce', icon: '🌿' },
  { title: 'Cold-Pressed Oil', desc: 'Sesame & groundnut — never refined palm', icon: '🫒' },
  { title: 'Sun-Dried', desc: 'Natural dehydration locks authentic flavor', icon: '☀️' },
  { title: 'Small Batches', desc: 'Made fresh weekly — never mass-produced', icon: '🏺' },
];

export function WhyHomemade() {
  return (
    <section className="py-24 px-6 bg-aph-surface/50">
      <div className="mx-auto max-w-6xl">
        <motion.h2
          className="font-[family-name:var(--font-display)] text-4xl text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          Why Homemade Wins
        </motion.h2>
        <motion.div
          className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
        >
          {benefits.map((b) => (
            <motion.article
              key={b.title}
              variants={{
                hidden: { opacity: 0, y: 30 },
                visible: { opacity: 1, y: 0 },
              }}
              className="p-6 rounded-2xl bg-aph-card border border-aph-gold/10 hover:border-aph-gold/30 transition-colors group"
              data-cursor="hover"
            >
              <span className="text-3xl mb-4 block group-hover:scale-110 transition-transform">{b.icon}</span>
              <h3 className="text-xl font-medium mb-2">{b.title}</h3>
              <p className="text-aph-muted text-sm">{b.desc}</p>
            </motion.article>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
