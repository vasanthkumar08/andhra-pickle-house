'use client';

import { motion } from 'framer-motion';

const wisps = Array.from({ length: 8 }, (_, i) => ({
  id: i,
  left: 10 + (i * 11) % 80,
  delay: i * 0.7,
  duration: 6 + (i % 3),
}));

export function SmokeParticles() {
  return (
    <motion.div className="pointer-events-none absolute inset-0 overflow-hidden opacity-40" aria-hidden>
      {wisps.map((w) => (
        <motion.span
          key={w.id}
          className="absolute bottom-0 w-32 h-32 rounded-full bg-gradient-to-t from-aph-muted/20 to-transparent blur-2xl"
          style={{ left: `${w.left}%` }}
          animate={{
            y: [0, -120, -200],
            opacity: [0, 0.5, 0],
            scale: [0.8, 1.2, 1.4],
          }}
          transition={{
            duration: w.duration,
            repeat: Infinity,
            delay: w.delay,
            ease: 'easeOut',
          }}
        />
      ))}
    </motion.div>
  );
}
