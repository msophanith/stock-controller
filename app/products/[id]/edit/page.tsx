'use client';
// app/products/[id]/edit/page.tsx

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import { ArrowLeft } from 'lucide-react';
import { Header } from '@/components/ui/header';
import { BottomNav } from '@/components/ui/bottom-nav';
import {
  ProductForm,
  type ProductFormData,
} from '@/components/stock/product-form';
import { dbSaveProduct, dbGetProductById } from '@/lib/db';
import { useProductStore } from '@/store/app-store';
import type { OfflineProduct } from '@/types';

export const dynamic = 'force-dynamic';

export default function EditProductPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { products, upsertProduct } = useProductStore();
  const [product, setProduct] = useState<OfflineProduct | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const storeProduct = products.find((p) => p.id === id);
    if (storeProduct) {
      setProduct(storeProduct);
    } else {
      dbGetProductById(id).then((p) => {
        if (p) setProduct(p);
      });
    }
  }, [id, products]);

  async function handleSubmit(data: ProductFormData) {
    if (!product) return;
    setIsLoading(true);
    try {
      const updated: OfflineProduct = {
        ...product,
        ...data,
        description: data.description ?? null,
        shelf: data.shelf ?? null,
        updatedAt: new Date().toISOString(),
        _pendingSync: true,
        _syncAction: 'UPDATE',
      };
      await dbSaveProduct(updated, 'UPDATE');
      upsertProduct(updated);
      toast.success('Product updated');
      router.push(`/products/${id}`);
    } catch (err) {
      toast.error('Failed to save product');
    } finally {
      setIsLoading(false);
    }
  }

  if (!product) {
    return (
      <div className='min-h-screen bg-slate-950 flex items-center justify-center'>
        <p className='text-slate-400'>Loading…</p>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-slate-950'>
      <Header
        title='Edit Product'
        subtitle={product.name}
        action={
          <Link
            href={`/products/${id}`}
            className='btn-secondary py-2 px-3 text-sm'
          >
            <ArrowLeft size={16} />
          </Link>
        }
      />

      <main className='px-4 pb-28 pt-4 page-enter'>
        <ProductForm
          defaultValues={{
            barcode: product.barcode,
            name: product.name,
            category: product.category,
            description: product.description ?? undefined,
            buyPrice: product.buyPrice,
            sellPrice: product.sellPrice,
            quantity: product.quantity,
            minStock: product.minStock,
            shelf: product.shelf ?? undefined,
            unit: product.unit,
          }}
          onSubmit={handleSubmit}
          onCancel={() => router.push(`/products/${id}`)}
          isLoading={isLoading}
          submitLabel='Update Product'
        />
      </main>

      <BottomNav />
    </div>
  );
}
