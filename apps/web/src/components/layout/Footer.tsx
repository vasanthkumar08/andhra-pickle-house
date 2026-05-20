'use client';

import { motion } from 'framer-motion';

export function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="border-t border-aph-gold/10 py-16 px-6 bg-aph-surface">
      <div className="mx-auto max-w-6xl grid md:grid-cols-3 gap-12">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
        >
          <h3 className="font-[family-name:var(--font-display)] text-2xl text-gradient-gold mb-2">
            Andhra Pickle House
          </h3>
          <p className="text-aph-muted text-sm">
            Premium homemade Andhra pickles — crafted with love since 1962.
          </p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
        >
          <h4 className="font-medium mb-4">Quick Links</h4>
          <ul className="space-y-2 text-aph-muted text-sm">
            <li><a href="#products" className="hover:text-aph-gold transition-colors">Shop</a></li>
            <li><a href="#story" className="hover:text-aph-gold transition-colors">Our Story</a></li>
            <li><a href="#faq" className="hover:text-aph-gold transition-colors">FAQ</a></li>
          </ul>
        </motion.div>
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
        >
          <h4 className="font-medium mb-4">Contact</h4>
          <p className="text-aph-muted text-sm">Vijayawada, Andhra Pradesh</p>
          <a
            href={`https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP || '919876543210'}`}
            className="text-aph-gold hover:underline text-sm mt-2 inline-block"
            target="_blank"
            rel="noopener noreferrer"
          >
            WhatsApp Us
          </a>
        </motion.div>
      </div>
      <p className="text-center text-aph-muted text-xs mt-12">
        © {year} Andhra Pickle House. All rights reserved.
      </p>
    </footer>
  );
}
