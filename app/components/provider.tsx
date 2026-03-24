'use client';
// components/providers.tsx

import { useEffect } from 'react';
import { initSyncListeners } from '@/lib/sync';
import { useProductStore } from '@/store/app-store';
import { dbGetAllProducts } from '@/lib/db';

export function AppProviders({ children }: { children: React.ReactNode }) {
  const setProducts = useProductStore((s) => s.setProducts);

  useEffect(() => {
    // Load all products from IndexedDB on mount
    async function hydrateLocal() {
      try {
        const products = await dbGetAllProducts();
        setProducts(products);
      } catch (err) {
        console.error('Failed to load local products:', err);
      }
    }

    hydrateLocal();

    // Wire up online/offline sync listeners
    const cleanup = initSyncListeners();

    return () => {
      cleanup();
    };
  }, [setProducts]);

  return <>{children}</>;
}
