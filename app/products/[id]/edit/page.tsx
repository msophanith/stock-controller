"use client";
// app/products/[id]/edit/page.tsx

import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { ArrowLeft, RefreshCw } from "lucide-react";
import { Header } from "@/components/ui/header";
import { BottomNav } from "@/components/ui/bottom-nav";
import {
  ProductForm,
  type ProductFormData,
} from "@/components/stock/product-form";
import { useProduct, useSaveProduct } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default function EditProductPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data: product, isLoading: productLoading } = useProduct(id);
  const { mutateAsync: saveProduct, isPending: savingProduct } =
    useSaveProduct();

  async function handleSubmit(data: ProductFormData) {
    if (!product) return;
    try {
      await saveProduct({
        ...product,
        ...data,
      });
      toast.success("Product updated");
      router.push(`/products/${id}`);
    } catch (err) {
      console.error("Failed to save product:", err);
      toast.error(err instanceof Error ? err.message : "Failed to save product");
    }
  }

  if (productLoading || !product) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center flex-col">
        <RefreshCw size={24} className="text-orange-500 animate-spin mb-3" />
        <p className="text-slate-400">Loading product details…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950">
      <Header
        title="Edit Product"
        subtitle={product.name}
        action={
          <Link
            href={`/products/${id}`}
            className="btn-secondary py-2 px-3 text-sm"
          >
            <ArrowLeft size={16} />
          </Link>
        }
      />

      <main className="px-4 pb-28 pt-4 page-enter">
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
          isLoading={savingProduct}
          submitLabel="Update Product"
        />
      </main>

      <BottomNav />
    </div>
  );
}
