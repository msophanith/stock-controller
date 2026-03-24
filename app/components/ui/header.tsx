'use client';
// components/ui/header.tsx

import { useAppStore } from '@/store/app-store';
import { Wifi, WifiOff, RefreshCw } from 'lucide-react';
import { cn, formatRelativeDate } from '@/lib/utils';
import { syncToServer } from '@/lib/sync';
import { ThemeToggle } from '@/components/theme-provider';

interface HeaderProps {
  readonly title: string;
  readonly subtitle?: string;
  readonly action?: React.ReactNode;
}

export function Header({
  title,
  subtitle,
  action,
}: Readonly<HeaderProps>) {
  const { isOnline, isSyncing, lastSyncedAt, pendingSyncCount } = useAppStore();

  const getSyncIcon = () => {
    if (isSyncing) {
      return <RefreshCw size={12} className='sync-pulse' />;
    }
    if (isOnline) {
      return <Wifi size={12} />;
    }
    return <WifiOff size={12} />;
  };

  const getSyncLabel = () => {
    if (isSyncing) {
      return 'Syncing…';
    }
    if (isOnline) {
      return lastSyncedAt ? formatRelativeDate(lastSyncedAt) : 'Online';
    }
    return 'Offline';
  };

  return (
    <header className='sticky top-0 z-40 dark:bg-slate-950/90 dark:border-slate-800/60 bg-white/90 border-slate-200/60 backdrop-blur-xl border-b px-4 pt-safe-pt'>
      <div className='flex items-center justify-between py-3'>
        <div className='min-w-0'>
          <h1 className='text-xl font-bold dark:text-slate-100 text-slate-900 truncate'>{title}</h1>
          {subtitle && (
            <p className='text-xs dark:text-slate-500 text-slate-600 truncate'>{subtitle}</p>
          )}
        </div>

        <div className='flex items-center gap-2 flex-shrink-0'>
          {/* Sync status */}
          <button
            onClick={() => syncToServer()}
            disabled={!isOnline || isSyncing}
            className={cn(
              'flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-all',
              isOnline
                ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'
                : 'border-amber-500/30 bg-amber-500/10 text-amber-400',
              isSyncing && 'opacity-75'
            )}
          >
            {getSyncIcon()}
            <span className='hidden sm:inline'>
              {getSyncLabel()}
            </span>
            {pendingSyncCount > 0 && (
              <span className='bg-amber-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center'>
                {pendingSyncCount > 9 ? '9+' : pendingSyncCount}
              </span>
            )}
          </button>

          <ThemeToggle />

          {action}
        </div>
      </div>
    </header>
  );
}
