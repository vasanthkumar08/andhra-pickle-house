import { motion } from 'framer-motion';

export function ProductSkeleton() {
  return (
    <div className="rounded-2xl border border-aph-border overflow-hidden animate-pulse">
      <div className="aspect-square bg-aph-border/60" />
      <div className="p-5 space-y-3">
        <motion.div className="h-5 bg-aph-border/60 rounded w-2/3" />
        <div className="h-4 bg-aph-border/40 rounded w-full" />
        <motion.div className="h-10 bg-aph-border/50 rounded-full mt-4" />
      </div>
    </div>
  );
}
