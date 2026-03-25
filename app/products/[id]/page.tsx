"use client";
// app/products/[id]/page.tsx

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
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
  Copy,
  Check,
  RefreshCw,
} from "lucide-react";
import { Header } from "@/components/ui/header";
import { BottomNav } from "@/components/ui/bottom-nav";
import { StockMovementModal } from "@/components/stock/stock-movement-modal";
import {
  formatCurrency,
  formatRelativeDate,
  getStockStatus,
  getStockStatusColor,
  cn,
} from "@/lib/utils";
import { useProduct, useAddMovement, useDeleteProduct } from "@/lib/queries";
import type { StockMovement } from "@/types";

export const dynamic = "force-dynamic";

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const { data: product, isLoading, isError } = useProduct(id);
  const { mutateAsync: addMovement } = useAddMovement();
  const { mutateAsync: deleteProduct } = useDeleteProduct();

  const [showMovementModal, setShowMovementModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [copiedBarcode, setCopiedBarcode] = useState(false);

  const movements = (product as any)?.movements || [];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white dark:bg-slate-950">
        <Header title="Loading…" />
        <main className="px-4 pt-20 flex flex-col items-center justify-center">
          <RefreshCw className="w-8 h-8 text-orange-500 animate-spin mb-4" />
          <p className="text-slate-400 animate-pulse">
            Fetching product details…
          </p>
        </main>
        <BottomNav />
      </div>
    );
  }

  if (isError || !product) {
    return (
      <div className="min-h-screen bg-white dark:bg-slate-950 flex items-center justify-center">
        <div className="text-center px-6">
          <Package
            size={48}
            className="text-slate-700 dark:text-slate-700 mx-auto mb-3"
          />
          <h2 className="text-xl font-bold text-slate-200 mb-2">
            Product not found
          </h2>
          <p className="text-slate-500 max-w-xs mx-auto">
            The product you're looking for might have been deleted or doesn't
            exist.
          </p>
          <Link href="/products" className="btn-secondary mt-6 inline-flex">
            <ArrowLeft size={16} /> Back to Products
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
      : "—";

  async function handleMovement(data: {
    type: "IN" | "OUT" | "ADJUSTMENT";
    quantity: number;
    note?: string;
    reference?: string;
  }) {
    if (!product) return;

    try {
      await addMovement({
        productId: product.id,
        type: data.type,
        quantity: data.quantity,
        note: data.note ?? null,
        reference: data.reference ?? null,
      });

      setShowMovementModal(false);

      let actionLabel = "adjusted";
      if (data.type === "IN") actionLabel = "added";
      else if (data.type === "OUT") actionLabel = "removed";

      toast.success(`Stock ${actionLabel}`);
    } catch (err) {
      console.error("Movement failed:", err);
      toast.error("Failed to update stock");
    }
  }

  async function handleDelete() {
    if (!confirm(`Delete "${product?.name}"? This cannot be undone.`)) return;
    setIsDeleting(true);
    try {
      await deleteProduct(product!.id);
      toast.success("Product deleted");
      router.push("/products");
    } catch {
      toast.error("Failed to delete product");
      setIsDeleting(false);
    }
  }

  async function handleCopyBarcode() {
    if (!product) return;
    try {
      await navigator.clipboard.writeText(product.barcode);
      setCopiedBarcode(true);
      toast.success("Barcode copied to clipboard");
      setTimeout(() => setCopiedBarcode(false), 2000);
    } catch {
      toast.error("Failed to copy barcode");
    }
  }

  const movementIconMap = {
    IN: <TrendingUp size={14} className="text-emerald-400" />,
    OUT: <TrendingDown size={14} className="text-red-400" />,
    ADJUSTMENT: <SlidersHorizontal size={14} className="text-blue-400" />,
  };

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950">
      <Header
        title={product.name}
        subtitle={product.category}
        action={
          <div className="flex gap-2">
            <Link
              href={`/products/${id}/edit`}
              className="btn-secondary py-2 px-3 text-sm"
            >
              <Edit2 size={15} />
            </Link>
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="btn-danger py-2 px-3 text-sm"
            >
              <Trash2 size={15} />
            </button>
          </div>
        }
      />

      <main className="px-4 pb-28 pt-4 space-y-4 page-enter">
        {/* Barcode + status */}
        <div className="flex items-center justify-between">
          <button
            onClick={handleCopyBarcode}
            className="flex items-center gap-2 font-mono text-xs text-slate-500 dark:text-slate-500 bg-slate-100 dark:bg-slate-800/60 px-2 py-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700/60 transition-colors"
            title="Click to copy barcode"
          >
            <span>{product.barcode}</span>
            {copiedBarcode ? (
              <Check size={14} className="text-emerald-400" />
            ) : (
              <Copy size={14} className="text-slate-600 dark:text-slate-600" />
            )}
          </button>
          <div className="flex items-center gap-2">
            <span className={cn("badge text-xs font-semibold", statusColor)}>
              {status === "out" && "Out of Stock"}
              {status === "low" && "Low Stock"}
              {(status === "ok" || status === "good") && "In Stock"}
            </span>
          </div>
        </div>

        {/* Stock quantity — BIG display */}
        <div className="card p-6 text-center">
          <p className="text-slate-500 dark:text-slate-500 text-sm mb-1">
            Current Stock
          </p>
          <p
            className={cn(
              "text-6xl font-bold font-price leading-none",
              status === "out"
                ? "text-red-400"
                : status === "low"
                  ? "text-amber-400"
                  : "text-emerald-400",
            )}
          >
            {product.quantity}
          </p>
          <p className="text-slate-500 dark:text-slate-500 mt-1">
            {product.unit}
          </p>
          {product.minStock > 0 && (
            <p className="text-xs text-slate-600 dark:text-slate-600 mt-2">
              Alert threshold: {product.minStock} {product.unit}
            </p>
          )}
        </div>

        {/* Stock actions */}
        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={() => setShowMovementModal(true)}
            className="btn-success flex-col py-4 gap-1.5 text-sm"
          >
            <TrendingUp size={22} />
            Stock In
          </button>
          <button
            onClick={() => setShowMovementModal(true)}
            className="btn-danger flex-col py-4 gap-1.5 text-sm"
          >
            <TrendingDown size={22} />
            Stock Out
          </button>
          <button
            onClick={() => setShowMovementModal(true)}
            className="btn-secondary flex-col py-4 gap-1.5 text-sm"
          >
            <SlidersHorizontal size={22} />
            Adjust
          </button>
        </div>

        {/* Price info */}
        <div className="card p-4 grid grid-cols-3 gap-3">
          <div className="text-center">
            <p className="text-xs text-slate-500 dark:text-slate-500 mb-1">
              Buy Price
            </p>
            <p className="font-price font-bold text-slate-300 dark:text-slate-300">
              {formatCurrency(product.buyPrice)}
            </p>
          </div>
          <div className="text-center border-x border-slate-800 dark:border-slate-800">
            <p className="text-xs text-slate-500 dark:text-slate-500 mb-1">
              Sell Price
            </p>
            <p className="font-price font-bold text-orange-400 text-lg">
              {formatCurrency(product.sellPrice)}
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-slate-500 dark:text-slate-500 mb-1">
              Margin
            </p>
            <p
              className={cn(
                "font-price font-bold",
                Number.parseFloat(margin) < 20
                  ? "text-amber-400"
                  : "text-emerald-400",
              )}
            >
              {margin}%
            </p>
          </div>
        </div>

        {/* Meta info */}
        <div className="card p-4 space-y-3">
          {product.description && (
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-500 mb-1">
                Description
              </p>
              <p className="text-sm text-slate-300 dark:text-slate-300">
                {product.description}
              </p>
            </div>
          )}
          <div className="flex items-center gap-4 text-sm">
            {product.shelf && (
              <span className="flex items-center gap-1.5 text-slate-400 dark:text-slate-400">
                <MapPin
                  size={14}
                  className="text-slate-500 dark:text-slate-500"
                />
                Shelf:{" "}
                <strong className="text-slate-200 dark:text-slate-200">
                  {product.shelf}
                </strong>
              </span>
            )}
            <span className="flex items-center gap-1.5 text-slate-400 dark:text-slate-400">
              <Package
                size={14}
                className="text-slate-500 dark:text-slate-500"
              />
              Unit:{" "}
              <strong className="text-slate-200 dark:text-slate-200">
                {product.unit}
              </strong>
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-600">
            <Clock size={11} />
            Updated {formatRelativeDate(product.updatedAt)}
          </div>
        </div>

        {/* Movement history */}
        <section>
          <h2 className="text-sm font-semibold text-slate-400 dark:text-slate-400 uppercase tracking-wider mb-3">
            Movement History
          </h2>
          {movements.length === 0 ? (
            <div className="card p-6 text-center">
              <p className="text-slate-500 dark:text-slate-500 text-sm">
                No movements recorded yet
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {movements.map((m: StockMovement) => {
                let label = "Adjustment";
                if (m.type === "IN") label = "Stock In";
                else if (m.type === "OUT") label = "Stock Out";

                let typeColor = "text-blue-400";
                if (m.type === "IN") typeColor = "text-emerald-400";
                else if (m.type === "OUT") typeColor = "text-red-400";

                let prefix = "⇔";
                if (m.type === "IN") prefix = "+";
                else if (m.type === "OUT") prefix = "−";

                return (
                  <div key={m.id} className="card p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-6 h-6 flex items-center justify-center flex-shrink-0">
                          {
                            movementIconMap[
                              m.type as keyof typeof movementIconMap
                            ]
                          }
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-slate-200 dark:text-slate-200">
                            {label}
                          </p>
                          {m.note && (
                            <p className="text-xs text-slate-500 dark:text-slate-500 truncate">
                              {m.note}
                            </p>
                          )}
                          {m.reference && (
                            <p className="text-xs text-slate-600 dark:text-slate-600 font-mono">
                              {m.reference}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p
                          className={cn(
                            "font-price font-bold text-sm",
                            typeColor,
                          )}
                        >
                          {prefix}
                          {m.quantity}
                        </p>
                        <p className="text-xs text-slate-600 dark:text-slate-600">
                          {formatRelativeDate(m.createdAt)}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
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
