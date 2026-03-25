// store/app-store.ts
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface AppState {
  isOnline: boolean;
  theme: "dark" | "light";
  scannerEnabled: boolean;
  barcodeHistory: string[];

  setIsOnline: (v: boolean) => void;
  setTheme: (t: "dark" | "light") => void;
  setScannerEnabled: (v: boolean) => void;
  addBarcodeToHistory: (barcode: string) => void;
  clearBarcodeHistory: () => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      isOnline: true,
      theme: "dark",
      scannerEnabled: true,
      barcodeHistory: [],

      setIsOnline: (v) => set({ isOnline: v }),
      setTheme: (t) => set({ theme: t }),
      setScannerEnabled: (v) => set({ scannerEnabled: v }),
      addBarcodeToHistory: (barcode) =>
        set((state) => ({
          barcodeHistory: [
            barcode,
            ...state.barcodeHistory.filter((b) => b !== barcode),
          ].slice(0, 20),
        })),
      clearBarcodeHistory: () => set({ barcodeHistory: [] }),
    }),
    {
      name: "car-stock-app-state",
      partialize: (state) => ({
        theme: state.theme,
        scannerEnabled: state.scannerEnabled,
        barcodeHistory: state.barcodeHistory,
      }),
    },
  ),
);

// store/product-store.ts
import type { Product } from "@/types";

interface ProductState {
  products: Product[];
  searchQuery: string;
  selectedCategory: string;
  scannedProduct: Product | null;
  isLoading: boolean;
  activityLog: string[];

  setProducts: (products: Product[]) => void;
  setSearchQuery: (q: string) => void;
  setSelectedCategory: (c: string) => void;
  setScannedProduct: (p: Product | null) => void;
  setIsLoading: (v: boolean) => void;
  upsertProduct: (product: Product) => void;
  removeProduct: (id: string) => void;
  addToActivityLog: (log: string) => void;
  clearActivityLog: () => void;
}

export const useProductStore = create<ProductState>((set) => ({
  products: [],
  searchQuery: "",
  selectedCategory: "All",
  scannedProduct: null,
  isLoading: false,
  activityLog: [],

  setProducts: (products: Product[]) => set({ products }),
  setSearchQuery: (searchQuery: string) => set({ searchQuery }),
  setSelectedCategory: (selectedCategory: string) => set({ selectedCategory }),
  setScannedProduct: (scannedProduct: Product | null) =>
    set({ scannedProduct }),
  setIsLoading: (isLoading: boolean) => set({ isLoading }),

  upsertProduct: (product: Product) =>
    set((state: ProductState) => {
      const idx = state.products.findIndex((p) => p.id === product.id);
      if (idx >= 0) {
        const next = [...state.products];
        next[idx] = product;
        return { products: next };
      }
      return { products: [product, ...state.products] };
    }),

  removeProduct: (id: string) =>
    set((state: ProductState) => ({
      products: state.products.filter((p) => p.id !== id),
    })),

  addToActivityLog: (log: string) =>
    set((state: ProductState) => ({
      activityLog: [log, ...state.activityLog].slice(0, 50),
    })),
  clearActivityLog: () => set({ activityLog: [] }),
}));
