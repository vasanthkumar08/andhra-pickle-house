'use client';

import { useEffect } from 'react';
import { useStore } from '@/store/use-store';
import { api } from '@/lib/api';
import type { PublicProduct } from '@aph/shared';

export function AppProvider({ children }: { children: React.ReactNode }) {
  const { setProducts, setUser, setCart } = useStore();

  useEffect(() => {
    void (async () => {
      const [productsRes, meRes, cartRes] = await Promise.all([
        api<PublicProduct[]>('/v1/products'),
        api<{ id: string; phone: string; name: string | null; role: string }>('/v1/auth/me'),
        api('/v1/cart'),
      ]);

      if (productsRes.data) setProducts(productsRes.data);

      if (meRes.data) setUser(meRes.data);
      if (cartRes.data) setCart(cartRes.data as Parameters<typeof setCart>[0]);
    })();
  }, [setProducts, setUser, setCart]);

  return <>{children}</>;
}
