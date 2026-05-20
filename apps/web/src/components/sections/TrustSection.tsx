'use client';

import { motion } from 'framer-motion';

const badges = [
  { label: 'FSSAI Ready', desc: 'Food safety compliant processes' },
  { label: '100% Homemade', desc: 'No factory production' },
  { label: 'WhatsApp Orders', desc: 'Personal confirmation every time' },
  { label: 'Pan-India Shipping', desc: 'Fresh batches weekly' },
];

export function TrustSection() {
  return (
    <section className="py-20 px-6 border-y border-aph-gold/10">
      <motion.div
        className="mx-auto max-w-6xl grid sm:grid-cols-2 lg:grid-cols-4 gap-8"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={{ visible: { transition: { staggerChildren: 0.08 } } }}
      >
        {badges.map((b) => (
          <motion.div
            key={b.label}
            variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
            className="text-center"
          >
            <div className="w-12 h-12 mx-auto mb-3 rounded-full border border-aph-gold/40 flex items-center justify-center text-aph-gold">
              ✓
            </div>
            <h3 className="font-medium mb-1">{b.label}</h3>
            <p className="text-aph-muted text-sm">{b.desc}</p>
          </motion.div>
        ))}
      </motion.div>
    </section>
  );
}
