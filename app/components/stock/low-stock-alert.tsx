'use client';
// components/stock/low-stock-alert.tsx

import Link from 'next/link';
import { AlertTriangle, ChevronRight } from 'lucide-react';
import type { OfflineProduct } from '@/types';
import { cn } from '@/lib/utils';

interface LowStockAlertProps {
  products: OfflineProduct[];
  className?: string;
}

export function LowStockAlert({ products, className }: LowStockAlertProps) {
  if (products.length === 0) return null;

  const outOfStock = products.filter((p) => p.quantity === 0);
  const lowStock = products.filter(
    (p) => p.quantity > 0 && p.quantity <= p.minStock
  );

  return (
    <div className={cn('space-y-2', className)}>
      {outOfStock.length > 0 && (
        <div className='bg-red-500/10 border border-red-500/30 rounded-xl p-3'>
          <div className='flex items-center justify-between mb-2'>
            <div className='flex items-center gap-2'>
              <AlertTriangle size={16} className='text-red-400' />
              <span className='text-sm font-semibold text-red-400'>
                Out of Stock ({outOfStock.length})
              </span>
            </div>
            <Link
              href='/products?filter=out'
              className='text-xs text-red-400/70 hover:text-red-400 flex items-center gap-0.5'
            >
              View all <ChevronRight size={12} />
            </Link>
          </div>
          <div className='space-y-1'>
            {outOfStock.slice(0, 3).map((p) => (
              <Link
                key={p.id}
                href={`/products/${p.id}`}
                className='flex items-center justify-between text-xs py-1 px-2 rounded-lg hover:bg-red-500/10 transition-colors'
              >
                <span className='text-slate-300 truncate mr-2'>{p.name}</span>
                <span className='text-red-400 font-bold font-mono flex-shrink-0'>
                  0 {p.unit}
                </span>
              </Link>
            ))}
            {outOfStock.length > 3 && (
              <p className='text-xs text-red-400/60 px-2'>
                +{outOfStock.length - 3} more…
              </p>
            )}
          </div>
        </div>
      )}

      {lowStock.length > 0 && (
        <div className='bg-amber-500/10 border border-amber-500/30 rounded-xl p-3'>
          <div className='flex items-center justify-between mb-2'>
            <div className='flex items-center gap-2'>
              <AlertTriangle size={16} className='text-amber-400' />
              <span className='text-sm font-semibold text-amber-400'>
                Low Stock ({lowStock.length})
              </span>
            </div>
            <Link
              href='/products?filter=low'
              className='text-xs text-amber-400/70 hover:text-amber-400 flex items-center gap-0.5'
            >
              View all <ChevronRight size={12} />
            </Link>
          </div>
          <div className='space-y-1'>
            {lowStock.slice(0, 3).map((p) => (
              <Link
                key={p.id}
                href={`/products/${p.id}`}
                className='flex items-center justify-between text-xs py-1 px-2 rounded-lg hover:bg-amber-500/10 transition-colors'
              >
                <span className='text-slate-300 truncate mr-2'>{p.name}</span>
                <span className='text-amber-400 font-bold font-mono flex-shrink-0'>
                  {p.quantity}/{p.minStock} {p.unit}
                </span>
              </Link>
            ))}
            {lowStock.length > 3 && (
              <p className='text-xs text-amber-400/60 px-2'>
                +{lowStock.length - 3} more…
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
