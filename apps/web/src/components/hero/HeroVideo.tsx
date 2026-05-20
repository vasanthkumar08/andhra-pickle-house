'use client';

import { useRef, useEffect, useState } from 'react';
import { motion } from 'framer-motion';

export type VideoCropVariant =
  | 'center'
  | 'top'
  | 'bottom'
  | 'left'
  | 'right'
  | 'zoom-mango'
  | 'zoom-spice'
  | 'zoom-jar';

const CROP_CLASSES: Record<VideoCropVariant, string> = {
  center: 'hero-crop-center',
  top: 'hero-crop-top',
  bottom: 'hero-crop-bottom',
  left: 'hero-crop-left',
  right: 'hero-crop-right',
  'zoom-mango': 'hero-crop-mango',
  'zoom-spice': 'hero-crop-spice',
  'zoom-jar': 'hero-crop-jar',
};

interface HeroVideoProps {
  src: string;
  poster: string;
  crop?: VideoCropVariant;
  priority?: boolean;
  className?: string;
}

/**
 * Cinematic hero video with professional reframe + edge vignette
 * to blend footage and minimize corner watermark visibility.
 */
export function HeroVideo({ src, poster, crop = 'center', priority = false, className = '' }: HeroVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    v.play().catch(() => {});
  }, [src]);

  if (failed) {
    return (
      <motion.div
        className={`absolute inset-0 bg-cover bg-center ${className}`}
        style={{ backgroundImage: `url(${poster})` }}
        initial={{ scale: 1.1 }}
        animate={{ scale: 1 }}
        transition={{ duration: 1.5 }}
      />
    );
  }

  return (
    <div className={`absolute inset-0 overflow-hidden ${className}`}>
      <video
        ref={videoRef}
        autoPlay
        muted
        loop
        playsInline
        preload={priority ? 'auto' : 'metadata'}
        poster={poster}
        className={`hero-video-layer ${CROP_CLASSES[crop]} transition-opacity duration-700 ${ready ? 'opacity-100' : 'opacity-0'}`}
        onLoadedData={() => setReady(true)}
        onError={() => setFailed(true)}
      >
        <source src={src} type="video/mp4" />
      </video>

      {/* Warm cinematic grade */}
      <motion.div className="absolute inset-0 bg-aph-terracotta/10 mix-blend-multiply pointer-events-none" />
      <motion.div className="absolute inset-0 bg-gradient-to-t from-aph-bg/70 via-transparent to-aph-bg/30 pointer-events-none" />
      <motion.div className="absolute inset-0 bg-gradient-to-r from-aph-bg/50 via-transparent to-aph-bg/40 pointer-events-none" />

      {/* Corner vignette — softens typical AI watermark zones */}
      <motion.div
        className="absolute inset-0 pointer-events-none hero-vignette-mask"
        aria-hidden
      />
    </div>
  );
}
