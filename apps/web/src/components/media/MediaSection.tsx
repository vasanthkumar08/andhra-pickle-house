'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import type { MediaAssetDto } from '@aph/shared';
import { api } from '@/lib/api';
import { HeroVideo, type VideoCropVariant } from '../hero/HeroVideo';

interface MediaSectionProps {
  section: string;
  title?: string;
  subtitle?: string;
  layout?: 'grid' | 'story';
  className?: string;
}

export function MediaSection({
  section,
  title,
  subtitle,
  layout = 'grid',
  className = '',
}: MediaSectionProps) {
  const [assets, setAssets] = useState<MediaAssetDto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api<MediaAssetDto[]>(`/v1/content/media?section=${section}`)
      .then((res) => {
        if (res.data?.length) setAssets(res.data);
      })
      .finally(() => setLoading(false));
  }, [section]);

  if (loading) {
    return (
      <div className={`py-16 px-6 ${className}`}>
        <motion.div className="mx-auto max-w-6xl grid md:grid-cols-2 gap-6">
          {[1, 2].map((i) => (
            <div key={i} className="h-64 rounded-2xl bg-aph-border/50 animate-pulse" />
          ))}
        </motion.div>
      </div>
    );
  }

  if (!assets.length) return null;

  return (
    <section className={`py-20 px-6 ${className}`}>
      <motion.div
        className="mx-auto max-w-6xl"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-80px' }}
        variants={{ visible: { transition: { staggerChildren: 0.12 } } }}
      >
        {(title || subtitle) && (
          <motion.div variants={{ hidden: { opacity: 0, y: 24 }, visible: { opacity: 1, y: 0 } }} className="text-center mb-12">
            {title && (
              <h2 className="font-[family-name:var(--font-display)] text-3xl md:text-4xl text-aph-ink">{title}</h2>
            )}
            {subtitle && <p className="mt-2 text-aph-muted max-w-xl mx-auto">{subtitle}</p>}
          </motion.div>
        )}

        <div className={layout === 'story' ? 'space-y-8' : 'grid md:grid-cols-2 gap-6'}>
          {assets.map((asset, i) => (
            <MediaCard key={asset.id} asset={asset} index={i} layout={layout} />
          ))}
        </div>
      </motion.div>
    </section>
  );
}

function MediaCard({
  asset,
  index,
  layout,
}: {
  asset: MediaAssetDto;
  index: number;
  layout: 'grid' | 'story';
}) {
  const crop = (asset.metadata?.crop as VideoCropVariant) ?? 'center';
  const poster = (asset.metadata?.poster as string) ?? asset.url;

  return (
    <motion.article
      variants={{ hidden: { opacity: 0, y: 40 }, visible: { opacity: 1, y: 0 } }}
      className={`group relative overflow-hidden rounded-2xl glass-card ${
        layout === 'story' && index % 2 === 1 ? 'md:ml-12' : ''
      }`}
      data-cursor="hover"
    >
      <div className="relative aspect-video overflow-hidden">
        {asset.type === 'video' ? (
          <HeroVideo src={asset.url} poster={poster} crop={crop} />
        ) : (
          <motion.div
            className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
            style={{ backgroundImage: `url(${asset.url})` }}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
      {asset.alt && (
        <p className="p-4 text-sm text-aph-muted">{asset.alt}</p>
      )}
    </motion.article>
  );
}
