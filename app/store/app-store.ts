// store/app-store.ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface AppState {
  isOnline: boolean
  isSyncing: boolean
  lastSyncedAt: Date | null
  pendingSyncCount: number
  theme: 'dark' | 'light'
  scannerEnabled: boolean
  barcodeHistory: string[]

  setIsOnline: (v: boolean) => void
  setSyncing: (v: boolean) => void
  setLastSyncedAt: (d: Date) => void
  setPendingSyncCount: (n: number) => void
  setTheme: (t: 'dark' | 'light') => void
  setScannerEnabled: (v: boolean) => void
  addBarcodeToHistory: (barcode: string) => void
  clearBarcodeHistory: () => void
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      isOnline: true,
      isSyncing: false,
      lastSyncedAt: null,
      pendingSyncCount: 0,
      theme: 'dark',
      scannerEnabled: true,
      barcodeHistory: [],

      setIsOnline: (v) => set({ isOnline: v }),
      setSyncing: (v) => set({ isSyncing: v }),
      setLastSyncedAt: (d) => set({ lastSyncedAt: d }),
      setPendingSyncCount: (n) => set({ pendingSyncCount: n }),
      setTheme: (t) => set({ theme: t }),
      setScannerEnabled: (v) => set({ scannerEnabled: v }),
      addBarcodeToHistory: (barcode) =>
        set((state) => ({
          barcodeHistory: [barcode, ...state.barcodeHistory.filter((b) => b !== barcode)].slice(0, 20),
        })),
      clearBarcodeHistory: () => set({ barcodeHistory: [] }),
    }),
    {
      name: 'car-stock-app-state',
      partialize: (state) => ({ 
        theme: state.theme, 
        scannerEnabled: state.scannerEnabled,
        barcodeHistory: state.barcodeHistory,
      }),
    }
  )
)

// store/product-store.ts
import { create as createProduct } from 'zustand'
import type { OfflineProduct } from '@/types'

interface ProductState {
  products: OfflineProduct[]
  searchQuery: string
  selectedCategory: string
  scannedProduct: OfflineProduct | null
  isLoading: boolean
  activityLog: string[]

  setProducts: (products: OfflineProduct[]) => void
  setSearchQuery: (q: string) => void
  setSelectedCategory: (c: string) => void
  setScannedProduct: (p: OfflineProduct | null) => void
  setIsLoading: (v: boolean) => void
  upsertProduct: (product: OfflineProduct) => void
  removeProduct: (id: string) => void
  addToActivityLog: (log: string) => void
  clearActivityLog: () => void
}

export const useProductStore = createProduct<ProductState>((set) => ({
  products: [],
  searchQuery: '',
  selectedCategory: 'All',
  scannedProduct: null,
  isLoading: false,
  activityLog: [],

  setProducts: (products) => set({ products }),
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  setSelectedCategory: (selectedCategory) => set({ selectedCategory }),
  setScannedProduct: (scannedProduct) => set({ scannedProduct }),
  setIsLoading: (isLoading) => set({ isLoading }),

  upsertProduct: (product) =>
    set((state) => {
      const idx = state.products.findIndex((p) => p.id === product.id)
      if (idx >= 0) {
        const next = [...state.products]
        next[idx] = product
        return { products: next }
      }
      return { products: [product, ...state.products] }
    }),

  removeProduct: (id) =>
    set((state) => ({ products: state.products.filter((p) => p.id !== id) })),

  addToActivityLog: (log) =>
    set((state) => ({
      activityLog: [log, ...state.activityLog].slice(0, 50),
    })),
  clearActivityLog: () => set({ activityLog: [] }),
}))