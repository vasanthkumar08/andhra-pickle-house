'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { useStore } from '@/store/use-store';
import { useTheme } from '@/components/providers/ThemeProvider';

export function Header() {
  const pathname = usePathname();
  const isHome = pathname === '/';
  const { cart, setCartDrawerOpen, user, openAuthModal } = useStore();
  const { toggle, theme } = useTheme();

  return (
    <motion.header
      className="fixed top-0 left-0 right-0 z-50 px-6 py-4 flex items-center justify-between bg-aph-bg/80 backdrop-blur-md border-b border-aph-border"
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <Link href="/" className="font-[family-name:var(--font-display)] text-xl text-gradient-gold">
        Andhra Pickle House
      </Link>
      <nav className="hidden md:flex gap-6 text-sm text-aph-muted">
        {isHome ? (
          <>
            <a href="#story" className="hover:text-aph-gold transition-colors">Story</a>
            <a href="#products" className="hover:text-aph-gold transition-colors">Pickles</a>
          </>
        ) : null}
        <Link href="/shop" className="hover:text-aph-gold transition-colors">Shop</Link>
        <Link href="/account" className="hover:text-aph-gold transition-colors">Account</Link>
        <Link href="/wishlist" className="hover:text-aph-gold transition-colors">Wishlist</Link>
      </nav>
      <motion.div className="flex items-center gap-3">
        <button
          type="button"
          onClick={toggle}
          className="p-2 rounded-full border border-aph-border text-sm"
          aria-label="Toggle theme"
        >
          {theme === 'light' ? '☀' : '☽'}
        </button>
        {user ? (
          <Link href="/account" className="text-sm text-aph-muted hidden sm:inline hover:text-aph-gold">
            +{user.phone.slice(-10)}
          </Link>
        ) : (
          <button type="button" onClick={() => openAuthModal()} className="text-sm text-aph-gold hover:underline">
            Login
          </button>
        )}
        <button
          type="button"
          onClick={() => setCartDrawerOpen(true)}
          className="relative p-2 rounded-full border border-aph-gold/30 hover:bg-aph-gold/10 transition-colors"
          data-cursor="hover"
          aria-label="Cart"
        >
          🛒
          {cart && cart.itemCount > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-aph-gold text-aph-bg text-xs rounded-full flex items-center justify-center">
              {cart.itemCount}
            </span>
          )}
        </button>
      </motion.div>
    </motion.header>
  );
}
