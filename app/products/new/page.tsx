'use client';
// app/products/new/page.tsx

import { useRouter, useSearchParams } from 'next/navigation';
import { nanoid } from 'nanoid';
import { toast } from 'sonner';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import {
  ProductForm,
  type ProductFormData,
} from '@/components/stock/product-form';
import { Header } from '@/components/ui/header';
import { BottomNav } from '@/components/ui/bottom-nav';
import { dbSaveProduct } from '@/lib/db';
import { useProductStore } from '@/store/app-store';

export const dynamic = 'force-dynamic';

export default function NewProductPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const upsertProduct = useProductStore((s) => s.upsertProduct);

  // Pre-fill barcode from scan
  const prefillBarcode = searchParams.get('barcode') ?? undefined;

  async function handleSubmit(data: ProductFormData) {
    const now = new Date().toISOString();
    const product = {
      id: nanoid(),
      ...data,
      description: data.description ?? null,
      shelf: data.shelf ?? null,
      imageUrl: null,
      createdAt: now,
      updatedAt: now,
      syncedAt: null,
      isDirty: true,
      _pendingSync: true,
      _syncAction: 'CREATE' as const,
    };

    await dbSaveProduct(product, 'CREATE');
    upsertProduct(product);
    toast.success('Product added successfully');
    router.push(`/products/${product.id}`);
  }

  return (
    <div className='min-h-screen bg-slate-950'>
      <Header
        title='New Product'
        subtitle='Add to inventory'
        action={
          <Link href='/products' className='btn-secondary py-2 px-3 text-sm'>
            <ArrowLeft size={16} />
          </Link>
        }
      />

      <main className='px-4 pb-28 pt-4 page-enter'>
        <ProductForm
          defaultValues={{ barcode: prefillBarcode }}
          onSubmit={handleSubmit}
          submitLabel='Add Product'
        />
      </main>

      <BottomNav />
    </div>
  );
}
