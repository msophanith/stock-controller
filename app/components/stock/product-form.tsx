"use client";
// components/stock/product-form.tsx

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Save, X } from "lucide-react";
import { PRODUCT_CATEGORIES, PRODUCT_UNITS, cn } from "@/lib/utils";
import type { Product } from "@/types";

const productSchema = z.object({
  barcode: z.string().min(1, "Barcode is required"),
  name: z.string().min(2, "Name must be at least 2 characters"),
  category: z.string().min(1, "Category is required"),
  description: z.string().optional(),
  buyPrice: z.coerce.number().min(0, "Must be ≥ 0"),
  sellPrice: z.coerce.number().min(0, "Must be ≥ 0"),
  quantity: z.coerce.number().int().min(0, "Must be ≥ 0"),
  minStock: z.coerce.number().int().min(0, "Must be ≥ 0"),
  shelf: z.string().optional(),
  unit: z.string().min(1, "Unit is required"),
});

export type ProductFormData = z.infer<typeof productSchema>;

interface ProductFormProps {
  defaultValues?: Partial<ProductFormData>;
  onSubmit: (data: ProductFormData) => Promise<void>;
  onCancel?: () => void;
  isLoading?: boolean;
  submitLabel?: string;
}

export function ProductForm({
  defaultValues,
  onSubmit,
  onCancel,
  isLoading,
  submitLabel = "Save Product",
}: ProductFormProps) {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isDirty },
  } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      unit: "pcs",
      quantity: 0,
      minStock: 5,
      ...defaultValues,
    },
  });

  const buyPrice = watch("buyPrice");
  const sellPrice = watch("sellPrice");
  const margin =
    buyPrice > 0
      ? (((sellPrice - buyPrice) / buyPrice) * 100).toFixed(1)
      : null;

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-5 dark:bg-slate-900 bg-slate-50 dark:border-slate-800 border-slate-200 border p-5 rounded-xl"
    >
      {/* Barcode */}
      <div>
        <label className="label">Barcode *</label>
        <input
          {...register("barcode")}
          className="input-field font-mono"
          placeholder="e.g. 5901234123457"
          inputMode="numeric"
        />
        {errors.barcode && (
          <p className="text-red-400 text-xs mt-1">{errors.barcode.message}</p>
        )}
      </div>

      {/* Name */}
      <div>
        <label className="label">Product Name *</label>
        <input
          {...register("name")}
          className="input-field"
          placeholder="e.g. Bosch Spark Plug WR7DC"
        />
        {errors.name && (
          <p className="text-red-400 text-xs mt-1">{errors.name.message}</p>
        )}
      </div>

      {/* Category */}
      <div>
        <label className="label">Category *</label>
        <select {...register("category")} className="input-field">
          <option value="">Select category…</option>
          {PRODUCT_CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        {errors.category && (
          <p className="text-red-400 text-xs mt-1">{errors.category.message}</p>
        )}
      </div>

      {/* Description */}
      <div>
        <label className="label">Description</label>
        <textarea
          {...register("description")}
          className="input-field resize-none"
          rows={2}
          placeholder="Optional product description…"
        />
      </div>

      {/* Prices */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Buy Price ($) *</label>
          <input
            {...register("buyPrice")}
            className="input-field font-price"
            type="number"
            step="0.01"
            min="0"
            placeholder="0.00"
          />
          {errors.buyPrice && (
            <p className="text-red-400 text-xs mt-1">
              {errors.buyPrice.message}
            </p>
          )}
        </div>
        <div>
          <label className="label">Sell Price ($) *</label>
          <input
            {...register("sellPrice")}
            className="input-field font-price"
            type="number"
            step="0.01"
            min="0"
            placeholder="0.00"
          />
          {errors.sellPrice && (
            <p className="text-red-400 text-xs mt-1">
              {errors.sellPrice.message}
            </p>
          )}
        </div>
      </div>

      {/* Margin indicator */}
      {margin !== null && (
        <div
          className={cn(
            "text-xs px-3 py-2 rounded-lg border",
            parseFloat(margin) < 0
              ? "bg-red-500/10 border-red-500/30 text-red-400"
              : parseFloat(margin) < 20
                ? "bg-amber-500/10 border-amber-500/30 text-amber-400"
                : "bg-emerald-500/10 border-emerald-500/30 text-emerald-400",
          )}
        >
          Margin: <strong>{margin}%</strong>
        </div>
      )}

      {/* Stock */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Current Stock *</label>
          <input
            {...register("quantity")}
            className="input-field font-price"
            type="number"
            min="0"
            step="1"
          />
          {errors.quantity && (
            <p className="text-red-400 text-xs mt-1">
              {errors.quantity.message}
            </p>
          )}
        </div>
        <div>
          <label className="label">Low Stock Alert *</label>
          <input
            {...register("minStock")}
            className="input-field font-price"
            type="number"
            min="0"
            step="1"
          />
          {errors.minStock && (
            <p className="text-red-400 text-xs mt-1">
              {errors.minStock.message}
            </p>
          )}
        </div>
      </div>

      {/* Shelf + Unit */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Shelf / Location</label>
          <input
            {...register("shelf")}
            className="input-field"
            placeholder="e.g. A1, B3"
          />
        </div>
        <div>
          <label className="label">Unit *</label>
          <select {...register("unit")} className="input-field">
            {PRODUCT_UNITS.map((u) => (
              <option key={u} value={u}>
                {u}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-2">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="btn-secondary flex-1"
          >
            <X size={18} />
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={isLoading || !isDirty}
          className="btn-primary flex-1"
        >
          <Save size={18} />
          {isLoading ? "Saving…" : submitLabel}
        </button>
      </div>
    </form>
  );
}
