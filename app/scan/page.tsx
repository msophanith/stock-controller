'use client';
// app/scan/page.tsx

import { useState, useCallback } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import {
  ScanLine,
  Plus,
  Package,
  TrendingUp,
  TrendingDown,
  Keyboard,
  X,
} from 'lucide-react';
import { Header } from '@/components/ui/header';
import { BottomNav } from '@/components/ui/bottom-nav';
import {
  BarcodeScanner,
  BarcodeInput,
} from '@/components/scanner/barcode-scanner';
import { StockMovementModal } from '@/components/stock/stock-movement-modal';
import { dbGetProductByBarcode, dbAddMovement } from '@/lib/db';
import { useProductStore } from '@/store/app-store';
import {
  formatCurrency,
  getStockStatus,
  getStockStatusColor,
  cn,
} from '@/lib/utils';
import type { OfflineProduct, OfflineMovement } from '@/types';
import { nanoid } from 'nanoid';

export const dynamic = 'force-dynamic';

type ScanMode = 'scanner' | 'keyboard';
type MovementType = 'IN' | 'OUT' | 'ADJUSTMENT';

function getQuantityDelta(
  type: MovementType,
  quantity: number
): number {
  if (type === 'IN') {
    return quantity;
  }
  if (type === 'OUT') {
    return -quantity;
  }
  return quantity;
}

function getMovementToastMessage(
  type: MovementType,
  quantity: number
): string {
  if (type === 'IN') {
    return `+${quantity} added`;
  }
  if (type === 'OUT') {
    return `-${quantity} removed`;
  }
  return 'Stock adjusted';
}

export default function ScanPage() {
  const { upsertProduct, addToActivityLog } = useProductStore();

  const [scanMode, setScanMode] = useState<ScanMode>('scanner');
  const [foundProduct, setFoundProduct] = useState<OfflineProduct | null>(null);
  const [notFoundBarcode, setNotFoundBarcode] = useState<string | null>(null);
  const [showMovementModal, setShowMovementModal] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  const handleBarcodeScan = useCallback(
    async (barcode: string) => {
      if (isSearching) return;
      setIsSearching(true);
      setFoundProduct(null);
      setNotFoundBarcode(null);

      try {
        const product = await dbGetProductByBarcode(barcode);
        if (product) {
          setFoundProduct(product);
          addToActivityLog(`Scanned: ${product.name} (${barcode})`);
          toast.success(`Found: ${product.name}`);
        } else {
          setNotFoundBarcode(barcode);
          toast.info('Product not found — add it?');
        }
      } catch (err) {
        console.error('Barcode scan error:', err);
        toast.error('Scan failed');
      } finally {
        setIsSearching(false);
      }
    },
    [isSearching, addToActivityLog]
  );

  async function handleMovement(data: {
    type: MovementType;
    quantity: number;
    note?: string;
    reference?: string;
  }) {
    if (!foundProduct) return;

    const movement: OfflineMovement = {
      id: nanoid(),
      productId: foundProduct.id,
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

    const delta = getQuantityDelta(data.type, data.quantity);
    const updated = {
      ...foundProduct,
      quantity: Math.max(0, foundProduct.quantity + delta),
      updatedAt: new Date().toISOString(),
      _pendingSync: true,
    };

    setFoundProduct(updated);
    upsertProduct(updated);
    
    // Log activity
    const action = data.type === 'IN' ? '+' : data.type === 'OUT' ? '-' : '⇔';
    addToActivityLog(`${action}${data.quantity} ${foundProduct.name}`);
    
    setShowMovementModal(false);

    const toastMessage = getMovementToastMessage(data.type, data.quantity);
    toast.success(toastMessage);
  }

  function resetScan() {
    setFoundProduct(null);
    setNotFoundBarcode(null);
  }

  const status = foundProduct
    ? getStockStatus(foundProduct.quantity, foundProduct.minStock)
    : null;
  const statusColor = status ? getStockStatusColor(status) : null;

  return (
    <div className='min-h-screen bg-white dark:bg-slate-950'>
      <Header
        title='Scan'
        subtitle='Scan a product barcode'
        action={
          <button
            onClick={() =>
              setScanMode((m) => (m === 'scanner' ? 'keyboard' : 'scanner'))
            }
            className='btn-secondary py-2 px-3 text-sm'
          >
            {scanMode === 'scanner' ? (
              <Keyboard size={16} />
            ) : (
              <ScanLine size={16} />
            )}
          </button>
        }
      />

      <main className='px-4 pb-28 pt-4 space-y-4 page-enter'>
        {/* Scanner / input */}
        {!foundProduct && !notFoundBarcode && (
          <>
            {scanMode === 'scanner' ? (
              <BarcodeScanner onScan={handleBarcodeScan} />
            ) : (
              <div className='space-y-3'>
                <p className='text-sm text-slate-500 dark:text-slate-500 text-center'>
                  Type or paste a barcode
                </p>
                <BarcodeInput onSubmit={handleBarcodeScan} />
              </div>
            )}
            {isSearching && (
              <div className='flex items-center justify-center gap-2 text-slate-600 dark:text-slate-400 text-sm py-4'>
                <div className='w-4 h-4 border-2 border-orange-500 border-t-transparent rounded-full animate-spin' />
                Looking up barcode…
              </div>
            )}
          </>
        )}

        {/* Product found */}
        {foundProduct && (
          <div className='space-y-3'>
            {/* Product card */}
            <div className='card p-5'>
              <div className='flex items-start justify-between gap-3 mb-4'>
                <div className='min-w-0'>
                  <h2 className='font-bold text-slate-900 dark:text-slate-100 text-lg leading-tight line-clamp-2'>
                    {foundProduct.name}
                  </h2>
                  <p className='text-sm text-slate-600 dark:text-slate-500 mt-0.5'>
                    {foundProduct.category}
                  </p>
                  <p className='font-mono text-xs text-slate-500 dark:text-slate-600 mt-1'>
                    {foundProduct.barcode}
                  </p>
                </div>
                <button
                  onClick={resetScan}
                  className='w-8 h-8 rounded-lg flex items-center justify-center text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 flex-shrink-0'
                >
                  <X size={16} />
                </button>
              </div>

              {/* Price + stock */}
              <div className='grid grid-cols-2 gap-3 mb-4'>
                <div className='bg-slate-100 dark:bg-slate-800/60 rounded-xl p-3 text-center'>
                  <p className='text-xs text-slate-600 dark:text-slate-500 mb-1'>Sell Price</p>
                  <p className='font-price font-bold text-xl text-orange-400'>
                    {formatCurrency(foundProduct.sellPrice)}
                  </p>
                </div>
                <div className='bg-slate-100 dark:bg-slate-800/60 rounded-xl p-3 text-center'>
                  <p className='text-xs text-slate-600 dark:text-slate-500 mb-1'>Stock</p>
                  <p
                    className={cn('font-price font-bold text-2xl', statusColor)}
                  >
                    {foundProduct.quantity}
                    <span className='text-sm font-normal text-slate-500 dark:text-slate-500 ml-1'>
                      {foundProduct.unit}
                    </span>
                  </p>
                </div>
              </div>

              {/* Quick actions */}
              <div className='grid grid-cols-2 gap-2'>
                <button
                  onClick={() => setShowMovementModal(true)}
                  className='btn-success py-3'
                >
                  <TrendingUp size={18} />
                  Stock In
                </button>
                <button
                  onClick={() => setShowMovementModal(true)}
                  className='btn-danger py-3'
                >
                  <TrendingDown size={18} />
                  Stock Out
                </button>
              </div>
            </div>

            {/* View + Scan again */}
            <div className='grid grid-cols-2 gap-2'>
              <Link
                href={`/products/${foundProduct.id}`}
                className='btn-secondary py-3'
              >
                <Package size={18} />
                View Details
              </Link>
              <button onClick={resetScan} className='btn-secondary py-3'>
                <ScanLine size={18} />
                Scan Again
              </button>
            </div>
          </div>
        )}

        {/* Product not found */}
        {notFoundBarcode && (
          <div className='space-y-4'>
            <div className='card p-6 text-center'>
              <Package size={48} className='text-slate-400 dark:text-slate-700 mx-auto mb-3' />
              <h2 className='font-bold text-slate-900 dark:text-slate-200 text-lg mb-1'>
                Product Not Found
              </h2>
              <p className='font-mono text-sm text-slate-600 dark:text-slate-500 bg-slate-100 dark:bg-slate-800/60 px-3 py-1.5 rounded-lg inline-block mt-1'>
                {notFoundBarcode}
              </p>
              <p className='text-sm text-slate-600 dark:text-slate-500 mt-3'>
                Would you like to add this product to your inventory?
              </p>
            </div>

            <Link
              href={`/products/new?barcode=${encodeURIComponent(
                notFoundBarcode
              )}`}
              className='btn-primary w-full py-4 text-base'
            >
              <Plus size={20} />
              Add New Product
            </Link>

            <button onClick={resetScan} className='btn-secondary w-full py-3'>
              <ScanLine size={18} />
              Scan Again
            </button>
          </div>
        )}
      </main>

      <BottomNav />

      {showMovementModal && foundProduct && (
        <StockMovementModal
          product={foundProduct}
          onSubmit={handleMovement}
          onClose={() => setShowMovementModal(false)}
        />
      )}
    </div>
  );
}
