'use client';
// app/history/page.tsx

import { useState, useEffect, useMemo } from 'react';
import {
  TrendingUp,
  TrendingDown,
  SlidersHorizontal,
  Clock,
} from 'lucide-react';
import Link from 'next/link';
import { Header } from '@/components/ui/header';
import { BottomNav } from '@/components/ui/bottom-nav';
import { dbGetRecentMovements, dbGetProductById } from '@/lib/db';
import type { OfflineMovement, OfflineProduct } from '@/types';
import { formatRelativeDate, formatDate, cn } from '@/lib/utils';
import { useProductStore } from '@/store/app-store';

export const dynamic = 'force-dynamic';

type FilterType = 'ALL' | 'IN' | 'OUT' | 'ADJUSTMENT';

const FILTER_OPTIONS: { value: FilterType; label: string }[] = [
  { value: 'ALL', label: 'All' },
  { value: 'IN', label: 'In' },
  { value: 'OUT', label: 'Out' },
  { value: 'ADJUSTMENT', label: 'Adjust' },
];

export default function HistoryPage() {
  const products = useProductStore((s) => s.products);
  const [movements, setMovements] = useState<OfflineMovement[]>([]);
  const [productMap, setProductMap] = useState<Map<string, OfflineProduct>>(
    new Map()
  );
  const [filter, setFilter] = useState<FilterType>('ALL');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setIsLoading(true);
      const recent = await dbGetRecentMovements(100);
      setMovements(recent);

      // Build product lookup from store + DB
      const map = new Map<string, OfflineProduct>();
      for (const p of products) map.set(p.id, p);

      // Fetch any not in store
      const missing = [...new Set(recent.map((m) => m.productId))].filter(
        (id) => !map.has(id)
      );
      for (const id of missing) {
        const p = await dbGetProductById(id);
        if (p) map.set(id, p);
      }
      setProductMap(map);
      setIsLoading(false);
    }
    load();
  }, [products]);

  const filtered = useMemo(
    () =>
      filter === 'ALL' ? movements : movements.filter((m) => m.type === filter),
    [movements, filter]
  );

  const movementConfig = {
    IN: {
      icon: TrendingUp,
      label: 'Stock In',
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10',
      sign: '+',
    },
    OUT: {
      icon: TrendingDown,
      label: 'Stock Out',
      color: 'text-red-400',
      bg: 'bg-red-500/10',
      sign: '−',
    },
    ADJUSTMENT: {
      icon: SlidersHorizontal,
      label: 'Adjustment',
      color: 'text-blue-400',
      bg: 'bg-blue-500/10',
      sign: '⇔',
    },
  };

  // Group movements by date
  const grouped = useMemo(() => {
    const groups: { date: string; items: OfflineMovement[] }[] = [];
    let currentDate = '';

    for (const m of filtered) {
      const date = new Date(m.createdAt).toLocaleDateString('en-GB', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
      });
      if (date !== currentDate) {
        currentDate = date;
        groups.push({ date, items: [] });
      }
      groups[groups.length - 1].items.push(m);
    }
    return groups;
  }, [filtered]);

  return (
    <div className='min-h-screen bg-white dark:bg-slate-950'>
      <Header title='History' subtitle={`${filtered.length} movements`} />

      <div className='sticky top-[57px] z-30 bg-white/95 dark:bg-slate-950/95 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800/60 px-4 py-3'>
        <div className='flex gap-2'>
          {FILTER_OPTIONS.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => setFilter(value)}
              className={cn(
                'px-4 py-1.5 rounded-lg text-sm font-medium border transition-all',
                filter === value
                  ? 'bg-orange-500/20 border-orange-500/40 text-orange-400'
                  : 'bg-slate-200 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400'
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <main className='px-4 pb-28 pt-4 space-y-6 page-enter'>
        {isLoading ? (
          <div className='flex items-center justify-center py-20'>
            <div className='w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin' />
          </div>
        ) : filtered.length === 0 ? (
          <div className='flex flex-col items-center justify-center py-20 text-center'>
            <Clock size={48} className='text-slate-400 dark:text-slate-700 mb-3' />
            <p className='text-slate-600 dark:text-slate-400 font-medium'>No movements yet</p>
            <p className='text-slate-500 dark:text-slate-600 text-sm mt-1'>
              Stock movements will appear here
            </p>
          </div>
        ) : (
          grouped.map(({ date, items }) => (
            <section key={date}>
              <h2 className='text-xs font-semibold text-slate-500 dark:text-slate-500 uppercase tracking-wider mb-2 px-1'>
                {date}
              </h2>
              <div className='space-y-2'>
                {items.map((m) => {
                  const config =
                    movementConfig[m.type as 'IN' | 'OUT' | 'ADJUSTMENT'];
                  const Icon = config.icon;
                  const product = productMap.get(m.productId);

                  return (
                    <div key={m.id} className='card p-3'>
                      <div className='flex items-center gap-3'>
                        <div
                          className={cn(
                            'w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0',
                            config.bg
                          )}
                        >
                          <Icon size={16} className={config.color} />
                        </div>

                        <div className='flex-1 min-w-0'>
                          <div className='flex items-start justify-between gap-2'>
                            <div className='min-w-0'>
                              {product ? (
                                <Link
                                  href={`/products/${product.id}`}
                                  className='font-medium text-slate-900 dark:text-slate-200 text-sm hover:text-orange-400 truncate block'
                                >
                                  {product.name}
                                </Link>
                              ) : (
                                <p className='font-medium text-slate-600 dark:text-slate-400 text-sm'>
                                  Unknown product
                                </p>
                              )}
                              <p className='text-xs text-slate-600 dark:text-slate-500'>
                                {config.label}
                                {m.note ? ` — ${m.note}` : ''}
                              </p>
                              {m.reference && (
                                <p className='text-xs text-slate-600 dark:text-slate-600 font-mono'>
                                  {m.reference}
                                </p>
                              )}
                            </div>
                            <div className='text-right flex-shrink-0'>
                              <p
                                className={cn(
                                  'font-price font-bold text-base',
                                  config.color
                                )}
                              >
                                {config.sign}
                                {m.quantity}
                              </p>
                              <p className='text-xs text-slate-600 dark:text-slate-600'>
                                {formatRelativeDate(m.createdAt)}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          ))
        )}
      </main>

      <BottomNav />
    </div>
  );
}
