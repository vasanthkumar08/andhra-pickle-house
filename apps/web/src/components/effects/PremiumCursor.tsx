'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { motion, useSpring } from 'framer-motion';

/**
 * Premium cursor interaction — converted from HTML/CSS cursor effect
 * to reusable React + Tailwind + Framer Motion component.
 */
export function PremiumCursor() {
  const [isHovering, setIsHovering] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const cursorRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);

  const cursorX = useSpring(0, { stiffness: 500, damping: 28 });
  const cursorY = useSpring(0, { stiffness: 500, damping: 28 });
  const ringX = useSpring(0, { stiffness: 150, damping: 20 });
  const ringY = useSpring(0, { stiffness: 150, damping: 20 });

  const onMouseMove = useCallback(
    (e: MouseEvent) => {
      cursorX.set(e.clientX);
      cursorY.set(e.clientY);
      ringX.set(e.clientX);
      ringY.set(e.clientY);
      if (!isVisible) setIsVisible(true);
    },
    [cursorX, cursorY, ringX, ringY, isVisible]
  );

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const isTouch = window.matchMedia('(pointer: coarse)').matches;
    if (isTouch) return;

    document.body.style.cursor = 'none';

    const handleOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const interactive = target.closest('a, button, [data-cursor="hover"]');
      setIsHovering(!!interactive);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseover', handleOver);

    return () => {
      document.body.style.cursor = '';
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseover', handleOver);
    };
  }, [onMouseMove]);

  if (typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches) {
    return null;
  }

  return (
    <>
      <motion.div
        ref={cursorRef}
        className="pointer-events-none fixed top-0 left-0 z-[9999] h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-aph-gold mix-blend-difference"
        style={{ x: cursorX, y: cursorY, opacity: isVisible ? 1 : 0 }}
      />
      <motion.div
        ref={ringRef}
        className="pointer-events-none fixed top-0 left-0 z-[9998] -translate-x-1/2 -translate-y-1/2 rounded-full border border-aph-gold/60"
        animate={{
          width: isHovering ? 56 : 36,
          height: isHovering ? 56 : 36,
          opacity: isVisible ? (isHovering ? 0.9 : 0.5) : 0,
        }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        style={{ x: ringX, y: ringY }}
      />
    </>
  );
}
