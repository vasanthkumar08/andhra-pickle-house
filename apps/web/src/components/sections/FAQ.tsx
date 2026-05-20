'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const faqs = [
  {
    q: 'How do I place an order?',
    a: 'Add pickles to cart, login with OTP, and checkout. Our server locks the order and sends confirmation.',
  },
  {
    q: 'Do you accept online payments?',
    a: 'Currently we confirm orders via WhatsApp. Payment on delivery or UPI details shared after confirmation.',
  },
  {
    q: 'How long do pickles last?',
    a: 'Unopened: 6-8 months refrigerated. Opened: consume within 4-6 weeks for best taste.',
  },
  {
    q: 'Do you ship outside India?',
    a: 'Yes! We ship to USA, UK, UAE, and more. Contact us on WhatsApp for international rates.',
  },
  {
    q: 'Are your pickles very spicy?',
    a: 'Each product shows spice level (1-5). We can customize heat on request for bulk orders.',
  },
];

export function FAQ() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section id="faq" className="py-24 px-6">
      <motion.h2
        className="font-[family-name:var(--font-display)] text-4xl text-center mb-12"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
      >
        Frequently Asked
      </motion.h2>
      <div className="mx-auto max-w-2xl space-y-2">
        {faqs.map((faq, i) => (
          <motion.div
            key={i}
            className="border border-aph-gold/10 rounded-xl overflow-hidden bg-aph-card"
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.05 }}
          >
            <button
              className="w-full px-6 py-4 text-left flex justify-between items-center"
              onClick={() => setOpen(open === i ? null : i)}
              data-cursor="hover"
            >
              <span className="font-medium">{faq.q}</span>
              <span className="text-aph-gold">{open === i ? '−' : '+'}</span>
            </button>
            <AnimatePresence>
              {open === i && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <p className="px-6 pb-4 text-aph-muted text-sm">{faq.a}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
