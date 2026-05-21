'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { Home, ReceiptText, Store, UserCircle } from 'lucide-react';
import { useStore } from '@/store/use-store';

const items = [
  { label: 'Home', href: '/', icon: Home },
  { label: 'Shop', href: '/shop', icon: Store },
  { label: 'Orders', href: '/account', icon: ReceiptText },
  { label: 'Account', href: '/account', icon: UserCircle },
] as const;

export function MobileBottomNav() {
  const pathname = usePathname();
  const { user, authHydrated, openAuthModal } = useStore();

  return (
    <motion.nav
      className="fixed inset-x-0 bottom-0 z-[70] border-t border-aph-border bg-aph-bg/92 px-2 pb-[calc(env(safe-area-inset-bottom)+0.35rem)] pt-2 shadow-[0_-12px_30px_rgba(0,0,0,0.08)] backdrop-blur-xl md:hidden"
      initial={{ y: 96 }}
      animate={{ y: 0 }}
      transition={{ type: 'spring', damping: 24, stiffness: 260 }}
      aria-label="Mobile primary navigation"
    >
      <div className="mx-auto grid max-w-md grid-cols-4 gap-1">
        {items.map((item) => {
          const Icon = item.icon;
          const active = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);
          const content = (
            <>
              <Icon size={20} aria-hidden="true" />
              <span className="text-[11px] font-medium leading-none">{item.label}</span>
              {active && <motion.span layoutId="mobile-nav-active" className="absolute inset-0 -z-10 rounded-2xl bg-aph-gold/12" />}
            </>
          );

          if ((item.label === 'Account' || item.label === 'Orders') && !authHydrated) {
            return (
              <button
                key={item.label}
                type="button"
                disabled
                className="relative flex min-w-0 flex-col items-center justify-center gap-1 rounded-2xl px-1.5 py-2 text-aph-muted/50"
              >
                {content}
              </button>
            );
          }

          if ((item.label === 'Account' || item.label === 'Orders') && !user) {
            return (
              <button
                key={item.label}
                type="button"
                onClick={() => openAuthModal()}
                className="relative flex min-w-0 flex-col items-center justify-center gap-1 rounded-2xl px-1.5 py-2 text-aph-muted transition hover:text-aph-gold"
              >
                {content}
              </button>
            );
          }

          return (
            <Link
              key={item.label}
              href={item.href}
              className={`relative flex min-w-0 flex-col items-center justify-center gap-1 rounded-2xl px-1.5 py-2 transition ${
                active ? 'text-aph-gold' : 'text-aph-muted hover:text-aph-gold'
              }`}
            >
              {content}
            </Link>
          );
        })}
      </div>
    </motion.nav>
  );
}
