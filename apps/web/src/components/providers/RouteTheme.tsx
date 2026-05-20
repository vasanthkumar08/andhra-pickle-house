'use client';

import { usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { useTheme } from './ThemeProvider';

/** Landing stays cinematic dark; shop/account use premium light. */
export function RouteTheme() {
  const pathname = usePathname();
  const { setTheme } = useTheme();

  useEffect(() => {
    if (pathname === '/' || pathname.startsWith('/order')) {
      setTheme('dark');
    } else {
      setTheme('light');
    }
  }, [pathname, setTheme]);

  return null;
}
