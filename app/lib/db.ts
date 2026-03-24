// lib/db.ts
// Dexie (IndexedDB wrapper) — offline-first local storage

import Dexie, { Table } from 'dexie';
import type { OfflineProduct, OfflineMovement, SyncQueueItem } from '@/types';

export class CarStockDB extends Dexie {
  products!: Table<OfflineProduct>;
  movements!: Table<OfflineMovement>;
  syncQueue!: Table<SyncQueueItem>;

  constructor() {
    super('CarStockDB');

    this.version(1).stores({
      products:
        '++_localId, id, barcode, name, category, quantity, minStock, updatedAt, _pendingSync, _syncAction',
      movements: '++_localId, id, productId, type, createdAt, _pendingSync',
      syncQueue: '++id, [table+recordId]',
    });
  }
}

// Singleton pattern — safe in Next.js browser context
let _db: CarStockDB | null = null;

export function getDB(): CarStockDB {
  if (typeof window === 'undefined') {
    throw new Error('Dexie DB can only be used in the browser');
  }
  if (!_db) {
    _db = new CarStockDB();
  }
  return _db;
}

// ─── Product helpers ──────────────────────────────────────────────────────────

export async function dbGetAllProducts(): Promise<OfflineProduct[]> {
  return getDB().products.orderBy('name').toArray();
}

export async function dbGetProductByBarcode(
  barcode: string
): Promise<OfflineProduct | undefined> {
  return getDB().products.where('barcode').equals(barcode).first();
}

export async function dbGetProductById(
  id: string
): Promise<OfflineProduct | undefined> {
  return getDB().products.where('id').equals(id).first();
}

export async function dbSaveProduct(
  product: OfflineProduct,
  syncAction: 'CREATE' | 'UPDATE' = 'UPDATE'
): Promise<void> {
  const db = getDB();
  const existing = await db.products.where('id').equals(product.id).first();

  const record: OfflineProduct = {
    ...product,
    updatedAt: new Date().toISOString(),
    _pendingSync: true,
    _syncAction: existing ? 'UPDATE' : syncAction,
  };

  if (existing) {
    await db.products.where('id').equals(product.id).modify(record);
  } else {
    await db.products.add(record);
  }

  // Add to sync queue
  await addToSyncQueue('products', record._syncAction!, product.id, record);
}

export async function dbDeleteProduct(id: string): Promise<void> {
  const db = getDB();
  await db.products.where('id').equals(id).delete();
  await addToSyncQueue('products', 'DELETE', id, { id });
}

export async function dbSearchProducts(
  query: string
): Promise<OfflineProduct[]> {
  const lower = query.toLowerCase();
  return getDB()
    .products.filter(
      (p) =>
        p.name.toLowerCase().includes(lower) ||
        p.barcode.includes(lower) ||
        p.category.toLowerCase().includes(lower) ||
        (p.shelf?.toLowerCase().includes(lower) ?? false)
    )
    .toArray();
}

export async function dbGetLowStockProducts(): Promise<OfflineProduct[]> {
  return getDB()
    .products.filter((p) => p.quantity <= p.minStock)
    .toArray();
}

// ─── Movement helpers ─────────────────────────────────────────────────────────

export async function dbAddMovement(movement: OfflineMovement): Promise<void> {
  const db = getDB();
  const record: OfflineMovement = {
    ...movement,
    _pendingSync: true,
  };
  await db.movements.add(record);

  // Update product quantity
  const product = await db.products
    .where('id')
    .equals(movement.productId)
    .first();
  if (product) {
    const delta =
      movement.type === 'IN'
        ? movement.quantity
        : movement.type === 'OUT'
        ? -movement.quantity
        : movement.quantity; // ADJUSTMENT is absolute delta

    const newQty = Math.max(0, product.quantity + delta);
    await db.products.where('id').equals(movement.productId).modify({
      quantity: newQty,
      updatedAt: new Date().toISOString(),
      _pendingSync: true,
      _syncAction: 'UPDATE',
    });
  }

  await addToSyncQueue('movements', 'CREATE', movement.id, record);
}

export async function dbGetMovementsForProduct(
  productId: string
): Promise<OfflineMovement[]> {
  return getDB()
    .movements.where('productId')
    .equals(productId)
    .reverse()
    .sortBy('createdAt');
}

export async function dbGetRecentMovements(
  limit = 50
): Promise<OfflineMovement[]> {
  return getDB()
    .movements.orderBy('createdAt')
    .reverse()
    .limit(limit)
    .toArray();
}

// ─── Sync Queue ───────────────────────────────────────────────────────────────

export async function addToSyncQueue(
  table: 'products' | 'movements',
  action: 'CREATE' | 'UPDATE' | 'DELETE',
  recordId: string,
  payload: object
): Promise<void> {
  const db = getDB();

  // Replace existing queued item for same record
  await db.syncQueue
    .where('[table+recordId]')
    .equals([table, recordId])
    .delete()
    .catch(() => {});

  await db.syncQueue.add({
    table,
    action,
    recordId,
    payload: JSON.stringify(payload),
    timestamp: Date.now(),
    retries: 0,
  });
}

export async function dbGetPendingSyncItems(): Promise<SyncQueueItem[]> {
  return getDB().syncQueue.orderBy('timestamp').toArray();
}

export async function dbRemoveSyncItem(id: number): Promise<void> {
  await getDB().syncQueue.delete(id);
}

export async function dbIncrementSyncRetry(
  id: number,
  error: string
): Promise<void> {
  await getDB()
    .syncQueue.where('id')
    .equals(id)
    .modify((item) => {
      item.retries += 1;
      item.lastError = error;
    });
}

// ─── Bulk import from server (initial hydration) ──────────────────────────────

export async function dbBulkImportProducts(
  products: OfflineProduct[]
): Promise<void> {
  const db = getDB();
  await db.transaction('rw', db.products, async () => {
    for (const p of products) {
      const existing = await db.products.where('id').equals(p.id).first();
      if (!existing) {
        await db.products.add({ ...p, _pendingSync: false });
      } else if (
        new Date(p.updatedAt) > new Date(existing.updatedAt as string) &&
        !existing._pendingSync
      ) {
        // Server wins if local has no pending changes
        await db.products
          .where('id')
          .equals(p.id)
          .modify({ ...p, _pendingSync: false });
      }
    }
  });
}

export async function dbBulkImportMovements(
  movements: OfflineMovement[]
): Promise<void> {
  const db = getDB();
  await db.transaction('rw', db.movements, async () => {
    for (const m of movements) {
      const existing = await db.movements.where('id').equals(m.id).first();
      if (!existing) {
        await db.movements.add({ ...m, _pendingSync: false });
      }
    }
  });
}
