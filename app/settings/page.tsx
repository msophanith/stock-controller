'use client';
// app/settings/page.tsx

import { useState } from 'react';
import { toast } from 'sonner';
import {
  RefreshCw,
  Wifi,
  WifiOff,
  Trash2,
  Database,
  Info,
  ChevronRight,
  Download,
} from 'lucide-react';
import { Header } from '@/components/ui/header';
import { BottomNav } from '@/components/ui/bottom-nav';
import { useAppStore } from '@/store/app-store';
import { syncToServer, syncFromServer } from '@/lib/sync';
import { getDB } from '@/lib/db';
import { formatDate } from '@/lib/utils';
import { cn } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export default function SettingsPage() {
  const {
    isOnline,
    isSyncing,
    lastSyncedAt,
    pendingSyncCount,
    scannerEnabled,
    setScannerEnabled,
  } = useAppStore();
  const [isClearingDB, setIsClearingDB] = useState(false);
  const [dbStats, setDbStats] = useState<{
    products: number;
    movements: number;
    pending: number;
  } | null>(null);

  async function loadDBStats() {
    const db = getDB();
    const [products, movements, pending] = await Promise.all([
      db.products.count(),
      db.movements.count(),
      db.syncQueue.count(),
    ]);
    setDbStats({ products, movements, pending });
  }

  async function handleForceSync() {
    if (!isOnline) {
      toast.error('No internet connection');
      return;
    }
    toast.loading('Syncing…', { id: 'sync' });
    const result = await syncToServer();
    await syncFromServer();
    toast.dismiss('sync');
    toast.success(
      `Synced: ${result.success} items` +
        (result.failed > 0 ? `, ${result.failed} failed` : '')
    );
    loadDBStats();
  }

  async function handleClearLocalDB() {
    if (
      !confirm(
        'This will delete ALL local data including unsynced changes. Are you sure?'
      )
    )
      return;
    setIsClearingDB(true);
    try {
      const db = getDB();
      await db.products.clear();
      await db.movements.clear();
      await db.syncQueue.clear();
      toast.success('Local database cleared');
      setDbStats({ products: 0, movements: 0, pending: 0 });
    } catch {
      toast.error('Failed to clear database');
    } finally {
      setIsClearingDB(false);
    }
  }

  async function handlePullFromServer() {
    if (!isOnline) {
      toast.error('No internet connection');
      return;
    }
    toast.loading('Downloading from server…', { id: 'pull' });
    await syncFromServer();
    toast.dismiss('pull');
    toast.success('Data refreshed from server');
    loadDBStats();
  }

  return (
    <div className='min-h-screen bg-white dark:bg-slate-950'>
      <Header title='Settings' subtitle='App configuration' />

      <main className='px-4 pb-28 pt-4 space-y-6 page-enter'>
        {/* Sync status */}
        <section className='card p-4 space-y-3'>
          <h2 className='text-sm font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider'>
            Sync Status
          </h2>

          <div className='flex items-center justify-between py-2'>
            <div className='flex items-center gap-2'>
              {isOnline ? (
                <Wifi size={18} className='text-emerald-400' />
              ) : (
                <WifiOff size={18} className='text-amber-400' />
              )}
              <div>
                <p className='text-sm font-medium text-slate-900 dark:text-slate-200'>
                  {isOnline ? 'Online' : 'Offline'}
                </p>
                <p className='text-xs text-slate-600 dark:text-slate-500'>
                  {lastSyncedAt
                    ? `Last synced: ${formatDate(lastSyncedAt)}`
                    : 'Never synced'}
                </p>
              </div>
            </div>
            {pendingSyncCount > 0 && (
              <span className='badge bg-amber-500/20 border-amber-500/30 text-amber-400'>
                {pendingSyncCount} pending
              </span>
            )}
          </div>

          <div className='space-y-2'>
            <button
              onClick={handleForceSync}
              disabled={!isOnline || isSyncing}
              className='btn-secondary w-full'
            >
              <RefreshCw size={16} className={isSyncing ? 'sync-pulse' : ''} />
              {isSyncing ? 'Syncing…' : 'Sync Now (Push)'}
            </button>
            <button
              onClick={handlePullFromServer}
              disabled={!isOnline || isSyncing}
              className='btn-secondary w-full'
            >
              <Download size={16} />
              Pull from Server
            </button>
          </div>
        </section>

        {/* Scanner */}
        <section className='card p-4 space-y-3'>
          <h2 className='text-sm font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider'>
            Scanner
          </h2>
          <div className='flex items-center justify-between'>
            <div>
              <p className='text-sm font-medium text-slate-900 dark:text-slate-200'>
                Barcode Scanner
              </p>
              <p className='text-xs text-slate-600 dark:text-slate-500'>
                Enable camera barcode scanning
              </p>
            </div>
            <button
              onClick={() => setScannerEnabled(!scannerEnabled)}
              className={cn(
                'relative w-12 h-6 rounded-full transition-colors duration-200',
                scannerEnabled ? 'bg-orange-500' : 'bg-slate-300 dark:bg-slate-700'
              )}
            >
              <span
                className={cn(
                  'absolute top-1 w-4 h-4 bg-white rounded-full transition-transform duration-200 shadow',
                  scannerEnabled ? 'translate-x-7' : 'translate-x-1'
                )}
              />
            </button>
          </div>
        </section>

        {/* Local database */}
        <section className='card p-4 space-y-3'>
          <div className='flex items-center justify-between'>
            <h2 className='text-sm font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider'>
              Local Database
            </h2>
            <button
              onClick={loadDBStats}
              className='text-xs text-orange-400 hover:text-orange-300'
            >
              Refresh stats
            </button>
          </div>

          {dbStats && (
            <div className='grid grid-cols-3 gap-2 text-center'>
              {[
                { label: 'Products', value: dbStats.products },
                { label: 'Movements', value: dbStats.movements },
                { label: 'Pending', value: dbStats.pending },
              ].map(({ label, value }) => (
                <div key={label} className='bg-slate-100 dark:bg-slate-800/60 rounded-xl p-3'>
                  <p className='font-price font-bold text-xl text-slate-900 dark:text-slate-200'>
                    {value}
                  </p>
                  <p className='text-xs text-slate-600 dark:text-slate-500'>{label}</p>
                </div>
              ))}
            </div>
          )}

          <button
            onClick={handleClearLocalDB}
            disabled={isClearingDB}
            className='btn-danger w-full'
          >
            <Trash2 size={16} />
            {isClearingDB ? 'Clearing…' : 'Clear Local Database'}
          </button>
          <p className='text-xs text-slate-600 dark:text-slate-600 text-center'>
            Warning: This deletes all local data. Only use if you have synced
            recently.
          </p>
        </section>

        {/* About */}
        <section className='card p-4 space-y-2'>
          <h2 className='text-sm font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-3'>
            About
          </h2>
          {[
            { label: 'App Version', value: '1.0.0' },
            { label: 'Offline Storage', value: 'IndexedDB (Dexie)' },
            { label: 'Sync Backend', value: 'Supabase Realtime' },
            { label: 'Framework', value: 'Next.js 14 App Router' },
          ].map(({ label, value }) => (
            <div
              key={label}
              className='flex items-center justify-between py-1.5'
            >
              <span className='text-sm text-slate-600 dark:text-slate-400'>{label}</span>
              <span className='text-sm font-medium text-slate-900 dark:text-slate-300'>
                {value}
              </span>
            </div>
          ))}
        </section>
      </main>

      <BottomNav />
    </div>
  );
}
