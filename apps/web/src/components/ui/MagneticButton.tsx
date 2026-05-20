'use client';

import { useRef, useState } from 'react';
import { motion } from 'framer-motion';

interface MagneticButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: 'primary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
}

export function MagneticButton({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  ...props
}: MagneticButtonProps) {
  const ref = useRef<HTMLButtonElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  const variants = {
    primary: 'bg-aph-gold text-aph-bg hover:bg-aph-gold-light',
    outline: 'border border-aph-gold/50 text-aph-gold hover:bg-aph-gold/10',
    ghost: 'text-aph-cream hover:bg-white/5',
  };

  const sizes = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg',
  };

  const handleMouse = (e: React.MouseEvent) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    setPosition({
      x: (e.clientX - rect.left - rect.width / 2) * 0.2,
      y: (e.clientY - rect.top - rect.height / 2) * 0.2,
    });
  };

  return (
    <motion.button
      ref={ref}
      onMouseMove={handleMouse}
      onMouseLeave={() => setPosition({ x: 0, y: 0 })}
      animate={{ x: position.x, y: position.y }}
      transition={{ type: 'spring', stiffness: 350, damping: 15 }}
      whileTap={{ scale: 0.96 }}
      className={`relative overflow-hidden rounded-full font-medium tracking-wide transition-colors ${variants[variant]} ${sizes[size]} ${className}`}
      {...(props as object)}
    >
      <span className="relative z-10">{children}</span>
    </motion.button>
  );
}
