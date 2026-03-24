// lib/sync.ts
// Offline → Online sync engine
// Strategy: timestamp-based last-write-wins
// Runs on navigator.onLine change and periodically

import {
  dbGetPendingSyncItems,
  dbRemoveSyncItem,
  dbIncrementSyncRetry,
  dbBulkImportProducts,
  dbBulkImportMovements,
  getDB,
} from './db'
import {
  getAllProducts,
  getRecentMovements,
} from './firebaseDb'
import { useAppStore } from '@/store/app-store'

const MAX_RETRIES = 5

// ─── Drain the sync queue ─────────────────────────────────────────────────────

export async function syncToServer(): Promise<{ success: number; failed: number }> {
  if (!navigator.onLine) return { success: 0, failed: 0 }

  const store = useAppStore.getState()
  store.setSyncing(true)

  const queue = await dbGetPendingSyncItems()
  let success = 0
  let failed = 0

  for (const item of queue) {
    if (item.retries >= MAX_RETRIES) {
      failed++
      continue
    }

    try {
      const response = await fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: [item] }),
      })

      if (!response.ok) throw new Error(`Sync failed with status ${response.status}`)

      const result = await response.json()
      if (result.results?.[0]?.success) {
        await dbRemoveSyncItem(item.id!)
        success++
      } else {
        throw new Error(result.results?.[0]?.error || 'Sync failed')
      }
    } catch (err: any) {
      const msg = err?.message ?? 'Unknown error'
      await dbIncrementSyncRetry(item.id!, msg)
      failed++
      console.warn('[Sync] Failed item:', item.recordId, msg)
    }
  }

  // Mark local records as synced
  if (success > 0) {
    const db = getDB()
    await db.products
      .filter((p) => p._pendingSync === true)
      .modify({ _pendingSync: false })
  }

  store.setSyncing(false)
  store.setLastSyncedAt(new Date())

  return { success, failed }
}

// ─── Pull from server (initial hydration / refresh) ──────────────────────────

export async function syncFromServer(): Promise<void> {
  if (!navigator.onLine) return

  try {
    const [products, movements] = await Promise.all([
      getAllProducts(),
      getRecentMovements(500),
    ])

    if (products && products.length > 0) {
      const mapped = products.map((p: any) => ({
        id: p.id,
        barcode: p.barcode,
        name: p.name,
        category: p.category,
        description: p.description,
        buyPrice: p.buyPrice,
        sellPrice: p.sellPrice,
        quantity: p.quantity,
        minStock: p.minStock,
        shelf: p.shelf,
        imageUrl: p.imageUrl,
        unit: p.unit ?? 'pcs',
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
        syncedAt: new Date().toISOString(),
      }))
      await dbBulkImportProducts(mapped)
    }

    if (movements && movements.length > 0) {
      const mapped = movements.map((m: any) => ({
        id: m.id,
        productId: m.productId,
        type: m.type,
        quantity: m.quantity,
        note: m.note,
        reference: m.reference,
        createdAt: m.createdAt,
        syncedAt: new Date().toISOString(),
      }))
      await dbBulkImportMovements(mapped)
    }
  } catch (err) {
    console.error('[SyncFromServer] Error:', err)
  }
}

// ─── Wire up online/offline listeners ────────────────────────────────────────

let syncInterval: ReturnType<typeof setInterval> | null = null

export function initSyncListeners() {
  const handleOnline = async () => {
    console.log('[Sync] Back online — syncing...')
    useAppStore.getState().setIsOnline(true)
    await syncToServer()
    await syncFromServer()
  }

  const handleOffline = () => {
    console.log('[Sync] Gone offline')
    useAppStore.getState().setIsOnline(false)
  }

  window.addEventListener('online', handleOnline)
  window.addEventListener('offline', handleOffline)

  // Periodic sync every 30 seconds when online
  syncInterval = setInterval(async () => {
    if (navigator.onLine) {
      await syncToServer()
    }
  }, 30_000)

  // Initial state
  useAppStore.getState().setIsOnline(navigator.onLine)
  if (navigator.onLine) {
    syncFromServer()
  }

  return () => {
    window.removeEventListener('online', handleOnline)
    window.removeEventListener('offline', handleOffline)
    if (syncInterval) clearInterval(syncInterval)
  }
}