// types/index.ts

export type ProductCategory =
  | 'Engine Parts'
  | 'Engine Oils'
  | 'Filters'
  | 'Wipers'
  | 'Lighting'
  | 'Fluids'
  | 'Drive Belts'
  | 'Brakes'
  | 'Suspension'
  | 'Electrical'
  | 'Bodywork'
  | 'Accessories'
  | 'Tools'
  | 'Other';

export type StockMovementType = 'IN' | 'OUT' | 'ADJUSTMENT';

export interface Product {
  id: string;
  barcode: string;
  name: string;
  category: ProductCategory | string;
  description?: string | null;
  buyPrice: number;
  sellPrice: number;
  quantity: number;
  minStock: number;
  shelf?: string | null;
  imageUrl?: string | null;
  unit: string;
  createdAt: Date | string;
  updatedAt: Date | string;
  syncedAt?: Date | string | null;
  isDirty?: boolean;
}

export interface StockMovement {
  id: string;
  productId: string;
  type: StockMovementType;
  quantity: number;
  note?: string | null;
  reference?: string | null;
  createdAt: Date | string;
  syncedAt?: Date | string | null;
  isDirty?: boolean;
  product?: Product;
}

export interface SyncLog {
  id: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE';
  table: string;
  recordId: string;
  payload: string;
  synced: boolean;
  createdAt: Date | string;
  syncedAt?: Date | string | null;
  error?: string | null;
}

export interface DashboardStats {
  totalProducts: number;
  totalValue: number;
  lowStockCount: number;
  todayMovements: number;
  outOfStock: number;
}

// Dexie offline DB types (mirror of Prisma but for IndexedDB)
export interface OfflineProduct extends Product {
  _localId?: number;
  _pendingSync?: boolean;
  _syncAction?: 'CREATE' | 'UPDATE' | 'DELETE';
}

export interface OfflineMovement extends StockMovement {
  _localId?: number;
  _pendingSync?: boolean;
}

export interface SyncQueueItem {
  id?: number;
  table: 'products' | 'movements';
  action: 'CREATE' | 'UPDATE' | 'DELETE';
  recordId: string;
  payload: string;
  timestamp: number;
  retries: number;
  lastError?: string;
}
