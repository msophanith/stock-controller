'use client';
// components/stock/product-card.tsx

import Link from 'next/link';
import { Package, AlertTriangle, MapPin, RefreshCw, Plus, Minus } from 'lucide-react';
import type { OfflineProduct } from '@/types';
import {
  formatCurrency,
  getStockStatus,
  getStockStatusColor,
  cn,
} from '@/lib/utils';
import { useProductStore } from '@/store/app-store';
import { dbAddMovement } from '@/lib/db';
import { nanoid } from 'nanoid';
import { toast } from 'sonner';

interface ProductCardProps {
  product: OfflineProduct;
  compact?: boolean;
  showQuickActions?: boolean;
}

export function ProductCard({ product, compact = false, showQuickActions = false }: ProductCardProps) {
  const status = getStockStatus(product.quantity, product.minStock);
  const statusColor = getStockStatusColor(status);
  const isLow = status === 'low' || status === 'out';
  const { upsertProduct, addToActivityLog } = useProductStore();

  const handleQuickAdjustment = async (delta: number) => {
    const newQuantity = Math.max(0, product.quantity + delta);
    const updated = {
      ...product,
      quantity: newQuantity,
      updatedAt: new Date().toISOString(),
      _pendingSync: true,
    };

    try {
      const movement = {
        id: nanoid(),
        productId: product.id,
        type: delta > 0 ? 'IN' : delta < 0 ? 'OUT' : 'ADJUSTMENT',
        quantity: Math.abs(delta),
        createdAt: new Date().toISOString(),
        syncedAt: null,
        isDirty: true,
        _pendingSync: true,
      };

      await dbAddMovement(movement as any);
      upsertProduct(updated);
      addToActivityLog(`${delta > 0 ? '+' : ''}${delta} ${product.name} (${product.barcode})`);
      toast.success(`${product.name}: ${newQuantity} ${product.unit}`);
    } catch (err) {
      toast.error('Failed to update stock');
      console.error(err);
    }
  };

  if (compact) {
    return (
      <Link href={`/products/${product.id}`} className='card-hover block p-3'>
        <div className='flex items-center gap-3'>
          <div className='w-10 h-10 rounded-lg bg-slate-800 dark:bg-slate-800 flex items-center justify-center flex-shrink-0'>
            <Package size={18} className='text-slate-400' />
          </div>
          <div className='min-w-0 flex-1'>
            <p className='font-medium text-slate-900 dark:text-slate-100 text-sm truncate'>
              {product.name}
            </p>
            <p className='text-xs text-slate-600 dark:text-slate-500 truncate'>{product.barcode}</p>
          </div>
          <div className='flex-shrink-0 text-right'>
            <p
              className={cn('text-sm font-bold font-price badge', statusColor)}
            >
              {product.quantity} {product.unit}
            </p>
          </div>
        </div>
      </Link>
    );
  }

  return (
    <div className='card-hover block p-4'>
      <Link href={`/products/${product.id}`}>
        <div className='flex items-start gap-3'>
          {/* Icon / thumbnail */}
          <div className='w-12 h-12 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center flex-shrink-0'>
            <Package size={22} className='text-slate-400' />
          </div>

          <div className='flex-1 min-w-0'>
            {/* Name + category */}
            <div className='flex items-start justify-between gap-2'>
              <div className='min-w-0'>
                <h3 className='font-semibold text-slate-900 dark:text-slate-100 leading-tight line-clamp-2 text-sm'>
                  {product.name}
                </h3>
                <p className='text-xs text-slate-600 dark:text-slate-400 mt-0.5'>
                  {product.category}
                </p>
              </div>
              {product._pendingSync && (
                <RefreshCw
                  size={12}
                  className='text-amber-400 flex-shrink-0 mt-0.5 sync-pulse'
                />
              )}
            </div>

            {/* Barcode + shelf */}
            <div className='flex items-center gap-3 mt-2'>
              <span className='font-mono text-[11px] text-slate-600 dark:text-slate-600 bg-slate-200 dark:bg-slate-800/60 px-1.5 py-0.5 rounded'>
                {product.barcode}
              </span>
              {product.shelf && (
                <span className='flex items-center gap-1 text-[11px] text-slate-600 dark:text-slate-500'>
                  <MapPin size={10} />
                  {product.shelf}
                </span>
              )}
            </div>

            {/* Price + stock row */}
            <div className='flex items-center justify-between mt-3'>
              <div className='flex items-baseline gap-3'>
                <span className='font-price font-bold text-lg text-slate-900 dark:text-slate-100'>
                  {formatCurrency(product.sellPrice)}
                </span>
                <span className='font-price text-xs text-slate-600 dark:text-slate-500'>
                  cost {formatCurrency(product.buyPrice)}
                </span>
              </div>

              <div className='flex items-center gap-1.5'>
                {isLow && (
                  <AlertTriangle
                    size={13}
                    className={
                      status === 'out' ? 'text-red-400' : 'text-amber-400'
                    }
                  />
                )}
                <span
                  className={cn(
                    'badge text-xs font-bold font-price',
                    statusColor
                  )}
                >
                  {product.quantity} {product.unit}
                </span>
              </div>
            </div>
          </div>
        </div>
      </Link>

      {/* Quick adjustment buttons */}
      {showQuickActions && (
        <div className='flex gap-2 mt-4 pt-3 border-t border-slate-700'>
          <button
            onClick={(e) => {
              e.preventDefault();
              handleQuickAdjustment(-1);
            }}
            className='flex-1 flex items-center justify-center gap-1 px-2 py-2 rounded-lg bg-red-500/20 border border-red-500/40 text-red-400 hover:bg-red-500/30 transition-colors text-xs font-medium'
          >
            <Minus size={14} />
            -1
          </button>
          <button
            onClick={(e) => {
              e.preventDefault();
              handleQuickAdjustment(5);
            }}
            className='flex-1 flex items-center justify-center gap-1 px-2 py-2 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/30 transition-colors text-xs font-medium'
          >
            <Plus size={14} />
            +5
          </button>
        </div>
      )}
    </div>
  );
}
