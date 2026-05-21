'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { LogOut, Moon, ShoppingBag, Sun, UserCircle } from 'lucide-react';
import { useStore } from '@/store/use-store';
import { useTheme } from '@/components/providers/ThemeProvider';
import { api } from '@/lib/api';

export function Header() {
  const pathname = usePathname();
  const isHome = pathname === '/';
  const { cart, setCart, setCartDrawerOpen, user, setUser, openAuthModal } = useStore();
  const { toggle, theme } = useTheme();
  const [accountOpen, setAccountOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const accountRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!accountOpen) return;
    const handlePointerDown = (event: PointerEvent) => {
      if (!accountRef.current?.contains(event.target as Node)) setAccountOpen(false);
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setAccountOpen(false);
    };
    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [accountOpen]);

  const logout = async () => {
    if (loggingOut) return;
    setLoggingOut(true);
    setAccountOpen(false);
    setUser(null);
    setCart(null);
    setCartDrawerOpen(false);
    await api('/v1/auth/logout', { method: 'POST' });
    setLoggingOut(false);
  };

  return (
    <motion.header
      className="fixed left-0 right-0 top-0 z-50 border-b border-aph-border bg-aph-bg/85 px-4 py-3 backdrop-blur-md sm:px-6 sm:py-4"
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-3">
        <Link href="/" className="min-w-0 font-[family-name:var(--font-display)] text-xl leading-none text-gradient-gold sm:text-2xl">
          <span className="block truncate">Andhra Pickle House</span>
        </Link>
        <nav className="hidden gap-6 text-sm text-aph-muted md:flex">
          {isHome ? (
            <>
              <a href="#story" className="transition-colors hover:text-aph-gold">Story</a>
              <a href="#products" className="transition-colors hover:text-aph-gold">Pickles</a>
            </>
          ) : null}
          <Link href="/shop" className="transition-colors hover:text-aph-gold">Shop</Link>
          <Link href="/account" className="transition-colors hover:text-aph-gold">Account</Link>
          <Link href="/wishlist" className="transition-colors hover:text-aph-gold">Wishlist</Link>
        </nav>
        <motion.div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={toggle}
            className="grid size-10 place-items-center rounded-full border border-aph-border text-aph-muted transition hover:text-aph-gold"
            aria-label="Toggle theme"
          >
            {theme === 'light' ? <Sun size={17} /> : <Moon size={17} />}
          </button>
          {user ? (
            <div ref={accountRef} className="relative">
              <button
                type="button"
                onClick={() => setAccountOpen((value) => !value)}
                className="flex h-10 items-center gap-2 rounded-full border border-aph-border px-2.5 text-sm transition hover:border-aph-gold/50 sm:px-3"
                aria-haspopup="menu"
                aria-expanded={accountOpen}
              >
                <UserCircle size={18} className="text-aph-gold" />
                <span className="hidden max-w-24 truncate sm:inline">{user.name || 'Account'}</span>
              </button>
              <AnimatePresence>
                {accountOpen && (
                  <motion.div
                    role="menu"
                    initial={{ opacity: 0, y: 8, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.98 }}
                    className="absolute right-0 top-12 w-56 overflow-hidden rounded-xl border border-aph-border bg-aph-card p-2 shadow-xl"
                  >
                    <Link
                      href="/account"
                      role="menuitem"
                      onClick={() => setAccountOpen(false)}
                      className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-aph-ink transition hover:bg-aph-gold/10"
                    >
                      <UserCircle size={16} /> My Account
                    </Link>
                    <button
                      type="button"
                      role="menuitem"
                      onClick={logout}
                      disabled={loggingOut}
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-aph-terracotta transition hover:bg-aph-terracotta/10 disabled:opacity-60"
                    >
                      <LogOut size={16} /> {loggingOut ? 'Signing out...' : 'Logout'}
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <button type="button" onClick={() => openAuthModal()} className="rounded-full bg-aph-gold px-4 py-2 text-sm font-medium text-aph-bg transition hover:bg-aph-gold-light">
              Login
            </button>
          )}
          <button
            type="button"
            onClick={() => setCartDrawerOpen(true)}
            className="relative grid size-10 place-items-center rounded-full border border-aph-gold/30 transition hover:bg-aph-gold/10"
            data-cursor="hover"
            aria-label="Cart"
          >
            <ShoppingBag size={18} />
            {cart && cart.itemCount > 0 && (
              <span className="absolute -right-1 -top-1 flex size-5 items-center justify-center rounded-full bg-aph-gold text-xs text-aph-bg">
                {cart.itemCount}
              </span>
            )}
          </button>
        </motion.div>
      </div>
    </motion.header>
  );
}
