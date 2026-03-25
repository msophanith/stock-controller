"use client";
// components/stock/stock-movement-modal.tsx

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { TrendingUp, TrendingDown, SlidersHorizontal, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { StockMovementType, Product } from "@/types";

const movementSchema = z.object({
  type: z.enum(["IN", "OUT", "ADJUSTMENT"]),
  quantity: z.coerce.number().int().min(1, "Must be at least 1"),
  note: z.string().optional(),
  reference: z.string().optional(),
});

type MovementFormData = z.infer<typeof movementSchema>;

interface StockMovementModalProps {
  product: Product;
  onSubmit: (data: MovementFormData) => Promise<void>;
  onClose: () => void;
}

const TYPE_CONFIG: Record<
  StockMovementType,
  { label: string; icon: React.ElementType; color: string; bg: string }
> = {
  IN: {
    label: "Stock In",
    icon: TrendingUp,
    color: "text-emerald-400",
    bg: "bg-emerald-500/20 border-emerald-500/40",
  },
  OUT: {
    label: "Stock Out",
    icon: TrendingDown,
    color: "text-red-400",
    bg: "bg-red-500/20 border-red-500/40",
  },
  ADJUSTMENT: {
    label: "Adjust",
    icon: SlidersHorizontal,
    color: "text-blue-400",
    bg: "bg-blue-500/20 border-blue-500/40",
  },
};

export function StockMovementModal({
  product,
  onSubmit,
  onClose,
}: StockMovementModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedType, setSelectedType] = useState<StockMovementType>("IN");

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<MovementFormData>({
    resolver: zodResolver(movementSchema),
    defaultValues: { type: "IN", quantity: 1 },
  });

  const quantity = watch("quantity") || 0;
  const previewQty =
    selectedType === "IN"
      ? product.quantity + quantity
      : selectedType === "OUT"
        ? Math.max(0, product.quantity - quantity)
        : quantity;

  async function handleFormSubmit(data: MovementFormData) {
    setIsLoading(true);
    try {
      await onSubmit({ ...data, type: selectedType });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
          <div>
            <h2 className="font-bold text-slate-100">Stock Movement</h2>
            <p className="text-xs text-slate-500 truncate max-w-[240px]">
              {product.name}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-800"
          >
            <X size={18} />
          </button>
        </div>

        <form
          onSubmit={handleSubmit(handleFormSubmit)}
          className="p-5 space-y-4"
        >
          {/* Current stock */}
          <div className="flex items-center justify-between bg-slate-800/60 rounded-xl px-4 py-3">
            <span className="text-sm text-slate-400">Current Stock</span>
            <span className="font-price font-bold text-xl text-slate-100">
              {product.quantity}{" "}
              <span className="text-slate-500 text-sm font-normal">
                {product.unit}
              </span>
            </span>
          </div>

          {/* Movement type */}
          <div>
            <label className="label">Movement Type</label>
            <div className="grid grid-cols-3 gap-2">
              {(Object.keys(TYPE_CONFIG) as StockMovementType[]).map((type) => {
                const { label, icon: Icon, color, bg } = TYPE_CONFIG[type];
                const isSelected = selectedType === type;
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setSelectedType(type)}
                    className={cn(
                      "flex flex-col items-center gap-1.5 py-3 rounded-xl border-2 transition-all duration-150",
                      isSelected
                        ? cn(bg, "border-current scale-[1.02]", color)
                        : "border-slate-700 bg-slate-800/40 text-slate-500 hover:border-slate-600",
                    )}
                  >
                    <Icon size={20} />
                    <span className="text-xs font-semibold">{label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quantity */}
          <div>
            <label className="label">
              {selectedType === "ADJUSTMENT" ? "New Quantity" : "Quantity"}
            </label>
            <div className="flex gap-2 items-center">
              <button
                type="button"
                onClick={() => {
                  const el = document.getElementById(
                    "qty-input",
                  ) as HTMLInputElement;
                  const cur = parseInt(el.value) || 1;
                  if (cur > 1) el.value = String(cur - 1);
                }}
                className="w-12 h-12 rounded-xl bg-slate-800 border border-slate-700 text-xl font-bold text-slate-300 hover:bg-slate-700 flex items-center justify-center flex-shrink-0"
              >
                −
              </button>
              <input
                id="qty-input"
                {...register("quantity")}
                type="number"
                min="1"
                step="1"
                className="input-field text-center font-price text-xl font-bold flex-1"
              />
              <button
                type="button"
                onClick={() => {
                  const el = document.getElementById(
                    "qty-input",
                  ) as HTMLInputElement;
                  el.value = String((parseInt(el.value) || 0) + 1);
                }}
                className="w-12 h-12 rounded-xl bg-slate-800 border border-slate-700 text-xl font-bold text-slate-300 hover:bg-slate-700 flex items-center justify-center flex-shrink-0"
              >
                +
              </button>
            </div>
            {errors.quantity && (
              <p className="text-red-400 text-xs mt-1">
                {errors.quantity.message}
              </p>
            )}
          </div>

          {/* Preview */}
          <div className="flex items-center justify-between bg-slate-800/40 rounded-xl px-4 py-3">
            <span className="text-sm text-slate-400">New Stock After</span>
            <span
              className={cn(
                "font-price font-bold text-xl",
                previewQty === 0
                  ? "text-red-400"
                  : previewQty <= product.minStock
                    ? "text-amber-400"
                    : "text-emerald-400",
              )}
            >
              {previewQty} {product.unit}
            </span>
          </div>

          {/* Note */}
          <div>
            <label className="label">Note / Reason</label>
            <input
              {...register("note")}
              className="input-field"
              placeholder="Optional note…"
            />
          </div>

          {/* Reference */}
          <div>
            <label className="label">Invoice / PO Reference</label>
            <input
              {...register("reference")}
              className="input-field font-mono"
              placeholder="e.g. INV-2024-001"
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isLoading}
            className={cn(
              "w-full flex items-center justify-center gap-2 py-4 rounded-xl font-bold text-base transition-all active:scale-[0.98]",
              selectedType === "IN"
                ? "bg-emerald-500 hover:bg-emerald-400 text-white"
                : selectedType === "OUT"
                  ? "bg-red-500 hover:bg-red-400 text-white"
                  : "bg-blue-500 hover:bg-blue-400 text-white",
            )}
          >
            {TYPE_CONFIG[selectedType].icon && (
              <span>
                {selectedType === "IN"
                  ? "↑"
                  : selectedType === "OUT"
                    ? "↓"
                    : "⇔"}
              </span>
            )}
            {isLoading
              ? "Saving…"
              : `Confirm ${TYPE_CONFIG[selectedType].label}`}
          </button>
        </form>
      </div>
    </div>
  );
}
