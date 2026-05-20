'use client';

import { motion } from 'framer-motion';

const particles = [
  { id: 0, x: 14, delay: 0.2, size: 5 },
  { id: 1, x: 58, delay: 1.4, size: 8 },
  { id: 2, x: 69, delay: 2.1, size: 5 },
  { id: 3, x: 74, delay: 0.8, size: 4 },
  { id: 4, x: 12, delay: 3.4, size: 7 },
  { id: 5, x: 33, delay: 1.8, size: 6 },
  { id: 6, x: 44, delay: 2.7, size: 9 },
  { id: 7, x: 87, delay: 0.5, size: 5 },
  { id: 8, x: 23, delay: 3.8, size: 8 },
  { id: 9, x: 51, delay: 1.1, size: 4 },
  { id: 10, x: 79, delay: 2.9, size: 7 },
  { id: 11, x: 6, delay: 1.6, size: 6 },
];

export function FloatingSpices() {
  return (
    <motion.div
      className="pointer-events-none absolute inset-0 overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 2 }}
    >
      {particles.map((p) => (
        <motion.span
          key={p.id}
          className="absolute rounded-full bg-aph-gold/30 blur-[1px]"
          style={{ left: `${p.x}%`, width: p.size, height: p.size }}
          animate={{
            y: ['100vh', '-10vh'],
            opacity: [0, 0.8, 0],
            rotate: [0, 360],
          }}
          transition={{
            duration: 8 + p.delay,
            repeat: Infinity,
            delay: p.delay,
            ease: 'linear',
          }}
        />
      ))}
    </motion.div>
  );
}
