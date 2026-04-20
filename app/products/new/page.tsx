"use client";
// app/products/new/page.tsx

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import {
  ProductForm,
  type ProductFormData,
} from "@/components/stock/product-form";
import { Header } from "@/components/ui/header";
import { BottomNav } from "@/components/ui/bottom-nav";
import { useSaveProduct } from "@/lib/queries";

function NewProductContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { mutateAsync: saveProduct } = useSaveProduct();

  // Pre-fill barcode from scan
  const prefillBarcode = searchParams.get("barcode") ?? undefined;

  async function handleSubmit(data: ProductFormData) {
    try {
      const product = await saveProduct(data);
      toast.success("Product added successfully");
      router.push(`/products/${product.id}`);
    } catch (err) {
      console.error("Failed to create product:", err);
      toast.error(err instanceof Error ? err.message : "Failed to add product");
    }
  }

  return (
    <>
      <Header
        title="New Product"
        subtitle="Add to inventory"
        action={
          <Link href="/products" className="btn-secondary py-2 px-3 text-sm">
            <ArrowLeft size={16} />
          </Link>
        }
      />

      <main className="px-4 pb-28 pt-4 page-enter">
        <ProductForm
          defaultValues={{ barcode: prefillBarcode }}
          onSubmit={handleSubmit}
          submitLabel="Add Product"
        />
      </main>

      <BottomNav />
    </>
  );
}

export default function NewProductPage() {
  return (
    <div className="min-h-screen bg-transparent">
      <Suspense fallback={<div className="min-h-screen bg-transparent" />}>
        <NewProductContent />
      </Suspense>
    </div>
  );
}
