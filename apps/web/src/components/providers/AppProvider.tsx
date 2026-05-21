'use client';

import { useEffect } from 'react';
import { useStore } from '@/store/use-store';
import { api } from '@/lib/api';
import type { PublicProduct } from '@aph/shared';

export function AppProvider({ children }: { children: React.ReactNode }) {
  const { setProducts, setUser, setCart, setAuthHydrated } = useStore();

  useEffect(() => {
    void (async () => {
      try {
        const productsRes = await api<PublicProduct[]>('/v1/products');
        if (productsRes.data) setProducts(productsRes.data);

        const meRes = await api<{ id: string; phone: string; name: string | null; role: string }>('/v1/auth/me');
        if (!meRes.data) {
          setUser(null);
          setCart(null);
          return;
        }

        setUser(meRes.data);
        const cartRes = await api('/v1/cart');
        if (cartRes.data) setCart(cartRes.data as Parameters<typeof setCart>[0]);
      } finally {
        setAuthHydrated(true);
      }
    })();
  }, [setProducts, setUser, setCart, setAuthHydrated]);

  return <>{children}</>;
}
