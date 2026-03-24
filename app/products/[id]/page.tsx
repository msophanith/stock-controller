'use client';
// app/products/[id]/page.tsx

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import {
  ArrowLeft,
  Edit2,
  Trash2,
  TrendingUp,
  TrendingDown,
  SlidersHorizontal,
  MapPin,
  Package,
  Clock,
  RefreshCw,
  Copy,
  Check,
} from 'lucide-react';
import { Header } from '@/components/ui/header';
import { BottomNav } from '@/components/ui/bottom-nav';
import { StockMovementModal } from '@/components/stock/stock-movement-modal';
import {
  dbGetProductById,
  dbAddMovement,
  dbGetMovementsForProduct,
  dbDeleteProduct,
} from '@/lib/db';
import { useProductStore } from '@/store/app-store';
import {
  formatCurrency,
  formatDate,
  formatRelativeDate,
  getStockStatus,
  getStockStatusColor,
  cn,
} from '@/lib/utils';
import type { OfflineProduct, OfflineMovement } from '@/types';
import { nanoid } from 'nanoid';

export const dynamic = 'force-dynamic';

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { products, upsertProduct, removeProduct } = useProductStore();

  const [product, setProduct] = useState<OfflineProduct | null>(null);
  const [movements, setMovements] = useState<OfflineMovement[]>([]);
  const [showMovementModal, setShowMovementModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [copiedBarcode, setCopiedBarcode] = useState(false);

  // Load from store or IndexedDB
  useEffect(() => {
    const storeProduct = products.find((p) => p.id === id);
    if (storeProduct) {
      setProduct(storeProduct);
    } else {
      dbGetProductById(id).then((p) => {
        if (p) setProduct(p);
      });
    }
    dbGetMovementsForProduct(id).then(setMovements);
  }, [id, products]);

  if (!product) {
    return (
      <div className='min-h-screen bg-white dark:bg-slate-950 flex items-center justify-center'>
        <div className='text-center'>
          <Package size={48} className='text-slate-700 dark:text-slate-700 mx-auto mb-3' />
          <p className='text-slate-400 dark:text-slate-400'>Product not found</p>
          <Link href='/products' className='btn-secondary mt-4 inline-flex'>
            <ArrowLeft size={16} /> Back
          </Link>
        </div>
      </div>
    );
  }

  const status = getStockStatus(product.quantity, product.minStock);
  const statusColor = getStockStatusColor(status);
  const margin =
    product.buyPrice > 0
      ? (
          ((product.sellPrice - product.buyPrice) / product.buyPrice) *
          100
        ).toFixed(1)
      : '—';

  async function handleMovement(data: {
    type: 'IN' | 'OUT' | 'ADJUSTMENT';
    quantity: number;
    note?: string;
    reference?: string;
  }) {
    if (!product) return;
    const movement: OfflineMovement = {
      id: nanoid(),
      productId: product.id,
      type: data.type,
      quantity: data.quantity,
      note: data.note ?? null,
      reference: data.reference ?? null,
      createdAt: new Date().toISOString(),
      syncedAt: null,
      isDirty: true,
      _pendingSync: true,
    };

    await dbAddMovement(movement);

    // Recalculate local quantity
    const delta =
      data.type === 'IN'
        ? data.quantity
        : data.type === 'OUT'
        ? -data.quantity
        : data.quantity;
    const updated = {
      ...product,
      quantity: Math.max(0, product.quantity + delta),
      updatedAt: new Date().toISOString(),
      _pendingSync: true,
    };

    setProduct(updated);
    upsertProduct(updated);
    setMovements((prev) => [movement, ...prev]);
    setShowMovementModal(false);
    toast.success(
      `Stock ${
        data.type === 'IN'
          ? 'added'
          : data.type === 'OUT'
          ? 'removed'
          : 'adjusted'
      }`
    );
  }

  async function handleDelete() {
    if (!confirm(`Delete "${product?.name}"? This cannot be undone.`)) return;
    setIsDeleting(true);
    try {
      await dbDeleteProduct(product!.id);
      removeProduct(product!.id);
      toast.success('Product deleted');
      router.push('/products');
    } catch {
      toast.error('Failed to delete product');
      setIsDeleting(false);
    }
  }

  async function handleCopyBarcode() {
    if (!product) return;
    try {
      await navigator.clipboard.writeText(product.barcode);
      setCopiedBarcode(true);
      toast.success('Barcode copied to clipboard');
      setTimeout(() => setCopiedBarcode(false), 2000);
    } catch {
      toast.error('Failed to copy barcode');
    }
  }

  const movementIcon = {
    IN: <TrendingUp size={14} className='text-emerald-400' />,
    OUT: <TrendingDown size={14} className='text-red-400' />,
    ADJUSTMENT: <SlidersHorizontal size={14} className='text-blue-400' />,
  };

  return (
    <div className='min-h-screen bg-white dark:bg-slate-950'>
      <Header
        title={product.name}
        subtitle={product.category}
        action={
          <div className='flex gap-2'>
            <Link
              href={`/products/${id}/edit`}
              className='btn-secondary py-2 px-3 text-sm'
            >
              <Edit2 size={15} />
            </Link>
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className='btn-danger py-2 px-3 text-sm'
            >
              <Trash2 size={15} />
            </button>
          </div>
        }
      />

      <main className='px-4 pb-28 pt-4 space-y-4 page-enter'>
        {/* Barcode + status */}
        <div className='flex items-center justify-between'>
          <button
            onClick={handleCopyBarcode}
            className='flex items-center gap-2 font-mono text-xs text-slate-500 dark:text-slate-500 bg-slate-100 dark:bg-slate-800/60 px-2 py-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700/60 transition-colors'
            title='Click to copy barcode'
          >
            <span>{product.barcode}</span>
            {copiedBarcode ? (
              <Check size={14} className='text-emerald-400' />
            ) : (
              <Copy size={14} className='text-slate-600 dark:text-slate-600' />
            )}
          </button>
          <div className='flex items-center gap-2'>
            {product._pendingSync && (
              <span className='flex items-center gap-1 text-xs text-amber-400'>
                <RefreshCw size={11} className='sync-pulse' /> Pending sync
              </span>
            )}
            <span className={cn('badge text-xs font-semibold', statusColor)}>
              {status === 'out'
                ? 'Out of Stock'
                : status === 'low'
                ? 'Low Stock'
                : 'In Stock'}
            </span>
          </div>
        </div>

        {/* Stock quantity — BIG display */}
        <div className='card p-6 text-center'>
          <p className='text-slate-500 dark:text-slate-500 text-sm mb-1'>Current Stock</p>
          <p
            className={cn(
              'text-6xl font-bold font-price leading-none',
              status === 'out'
                ? 'text-red-400'
                : status === 'low'
                ? 'text-amber-400'
                : 'text-emerald-400'
            )}
          >
            {product.quantity}
          </p>
          <p className='text-slate-500 dark:text-slate-500 mt-1'>{product.unit}</p>
          {product.minStock > 0 && (
            <p className='text-xs text-slate-600 dark:text-slate-600 mt-2'>
              Alert threshold: {product.minStock} {product.unit}
            </p>
          )}
        </div>

        {/* Stock actions */}
        <div className='grid grid-cols-3 gap-2'>
          <button
            onClick={() => setShowMovementModal(true)}
            className='btn-success flex-col py-4 gap-1.5 text-sm'
          >
            <TrendingUp size={22} />
            Stock In
          </button>
          <button
            onClick={() => setShowMovementModal(true)}
            className='btn-danger flex-col py-4 gap-1.5 text-sm'
          >
            <TrendingDown size={22} />
            Stock Out
          </button>
          <button
            onClick={() => setShowMovementModal(true)}
            className='btn-secondary flex-col py-4 gap-1.5 text-sm'
          >
            <SlidersHorizontal size={22} />
            Adjust
          </button>
        </div>

        {/* Price info */}
        <div className='card p-4 grid grid-cols-3 gap-3'>
          <div className='text-center'>
            <p className='text-xs text-slate-500 dark:text-slate-500 mb-1'>Buy Price</p>
            <p className='font-price font-bold text-slate-300 dark:text-slate-300'>
              {formatCurrency(product.buyPrice)}
            </p>
          </div>
          <div className='text-center border-x border-slate-800 dark:border-slate-800'>
            <p className='text-xs text-slate-500 dark:text-slate-500 mb-1'>Sell Price</p>
            <p className='font-price font-bold text-orange-400 text-lg'>
              {formatCurrency(product.sellPrice)}
            </p>
          </div>
          <div className='text-center'>
            <p className='text-xs text-slate-500 dark:text-slate-500 mb-1'>Margin</p>
            <p
              className={cn(
                'font-price font-bold',
                parseFloat(margin) < 20 ? 'text-amber-400' : 'text-emerald-400'
              )}
            >
              {margin}%
            </p>
          </div>
        </div>

        {/* Meta info */}
        <div className='card p-4 space-y-3'>
          {product.description && (
            <div>
              <p className='text-xs text-slate-500 dark:text-slate-500 mb-1'>Description</p>
              <p className='text-sm text-slate-300 dark:text-slate-300'>{product.description}</p>
            </div>
          )}
          <div className='flex items-center gap-4 text-sm'>
            {product.shelf && (
              <span className='flex items-center gap-1.5 text-slate-400 dark:text-slate-400'>
                <MapPin size={14} className='text-slate-500 dark:text-slate-500' />
                Shelf:{' '}
                <strong className='text-slate-200 dark:text-slate-200'>{product.shelf}</strong>
              </span>
            )}
            <span className='flex items-center gap-1.5 text-slate-400 dark:text-slate-400'>
              <Package size={14} className='text-slate-500 dark:text-slate-500' />
              Unit: <strong className='text-slate-200 dark:text-slate-200'>{product.unit}</strong>
            </span>
          </div>
          <div className='flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-600'>
            <Clock size={11} />
            Updated {formatRelativeDate(product.updatedAt)}
          </div>
        </div>

        {/* Movement history */}
        <section>
          <h2 className='text-sm font-semibold text-slate-400 dark:text-slate-400 uppercase tracking-wider mb-3'>
            Movement History
          </h2>
          {movements.length === 0 ? (
            <div className='card p-6 text-center'>
              <p className='text-slate-500 dark:text-slate-500 text-sm'>
                No movements recorded yet
              </p>
            </div>
          ) : (
            <div className='space-y-2'>
              {movements.map((m) => (
                <div key={m.id} className='card p-3'>
                  <div className='flex items-start justify-between gap-2'>
                    <div className='flex items-center gap-2 min-w-0'>
                      <div className='w-6 h-6 flex items-center justify-center flex-shrink-0'>
                        {movementIcon[m.type as 'IN' | 'OUT' | 'ADJUSTMENT']}
                      </div>
                      <div className='min-w-0'>
                        <p className='text-sm font-medium text-slate-200 dark:text-slate-200'>
                          {m.type === 'IN'
                            ? 'Stock In'
                            : m.type === 'OUT'
                            ? 'Stock Out'
                            : 'Adjustment'}
                        </p>
                        {m.note && (
                          <p className='text-xs text-slate-500 dark:text-slate-500 truncate'>
                            {m.note}
                          </p>
                        )}
                        {m.reference && (
                          <p className='text-xs text-slate-600 dark:text-slate-600 font-mono'>
                            {m.reference}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className='text-right flex-shrink-0'>
                      <p
                        className={cn(
                          'font-price font-bold text-sm',
                          m.type === 'IN'
                            ? 'text-emerald-400'
                            : m.type === 'OUT'
                            ? 'text-red-400'
                            : 'text-blue-400'
                        )}
                      >
                        {m.type === 'IN' ? '+' : m.type === 'OUT' ? '−' : '⇔'}
                        {m.quantity}
                      </p>
                      <p className='text-xs text-slate-600 dark:text-slate-600'>
                        {formatRelativeDate(m.createdAt)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      <BottomNav />

      {showMovementModal && (
        <StockMovementModal
          product={product}
          onSubmit={handleMovement}
          onClose={() => setShowMovementModal(false)}
        />
      )}
    </div>
  );
}
