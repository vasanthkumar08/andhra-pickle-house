'use client';

import { create } from 'zustand';
import type { PublicProduct } from '@aph/shared';

interface User {
  id: string;
  phone: string;
  name: string | null;
  role: string;
}

interface CartItem {
  id: string;
  productId: string;
  slug?: string;
  name?: string;
  nameTe?: string;
  imageUrl?: string;
  weightGrams: number;
  weightLabel: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  inStock: boolean;
}

interface Cart {
  id: string;
  items: CartItem[];
  subtotal: number;
  itemCount: number;
}

interface AppState {
  user: User | null;
  cart: Cart | null;
  products: PublicProduct[];
  authModalOpen: boolean;
  cartDrawerOpen: boolean;
  pendingAdd: { productId: string; weightGrams: number; quantity: number } | null;
  setUser: (user: User | null) => void;
  setCart: (cart: Cart | null) => void;
  logoutLocal: () => void;
  setProducts: (products: PublicProduct[]) => void;
  openAuthModal: (pending?: AppState['pendingAdd']) => void;
  closeAuthModal: () => void;
  setCartDrawerOpen: (open: boolean) => void;
}

export const useStore = create<AppState>((set) => ({
  user: null,
  cart: null,
  products: [],
  authModalOpen: false,
  cartDrawerOpen: false,
  pendingAdd: null,
  setUser: (user) => set({ user }),
  setCart: (cart) => set({ cart }),
  logoutLocal: () => set({ user: null, cart: null, cartDrawerOpen: false, authModalOpen: false, pendingAdd: null }),
  setProducts: (products) => set({ products }),
  openAuthModal: (pending) => set({ authModalOpen: true, pendingAdd: pending ?? null }),
  closeAuthModal: () => set({ authModalOpen: false, pendingAdd: null }),
  setCartDrawerOpen: (open) => set({ cartDrawerOpen: open }),
}));
