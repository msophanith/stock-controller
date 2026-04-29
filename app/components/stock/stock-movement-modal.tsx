"use client";

import { useState } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { StockMovementType, Product } from "@/types";

import {
  movementSchema,
  TYPE_CONFIG,
  type MovementFormData,
} from "./movement-modal/schema";
import { QuantitySelector } from "./movement-modal/quantity-selector";
import { PriceAdjustment } from "./movement-modal/price-adjustment";

interface StockMovementModalProps {
  readonly product: Product;
  readonly defaultType?: StockMovementType;
  readonly onSubmit: (data: MovementFormData) => Promise<void>;
  readonly onClose: () => void;
}

export function StockMovementModal({
  product,
  defaultType = "IN",
  onSubmit,
  onClose,
}: StockMovementModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedType, setSelectedType] =
    useState<StockMovementType>(defaultType);

  const methods = useForm<MovementFormData>({
    resolver: zodResolver(movementSchema),
    defaultValues: {
      type: defaultType,
      quantity: 1,
      unitPrice: product.sellPrice,
    },
  });

  const { register, handleSubmit, watch } = methods;
  const quantity = watch("quantity") || 0;
  const unitPrice = watch("unitPrice") || product.sellPrice;

  const previewQty =
    selectedType === "IN" || selectedType === "RETURN"
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
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-t-[2.5rem] sm:rounded-2xl flex flex-col max-h-[92vh] sm:max-h-[85vh] overflow-hidden shadow-2xl animate-in slide-in-from-bottom-8 duration-300">
        <div className="w-12 h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full mx-auto mt-3 mb-1 sm:hidden flex-shrink-0" />

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 sm:px-5 border-b border-slate-200 dark:border-slate-800 flex-shrink-0">
          <div>
            <h2 className="font-bold text-slate-900 dark:text-slate-100">
              Stock Movement
            </h2>
            <p className="text-xs text-slate-500 truncate max-w-[240px]">
              {product.name}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X size={18} />
          </button>
        </div>

        <FormProvider {...methods}>
          <form
            onSubmit={handleSubmit(handleFormSubmit)}
            className="flex-1 flex flex-col overflow-hidden"
          >
            <div className="p-6 sm:p-5 space-y-5 overflow-y-auto flex-1 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-800">
              {/* Current stock status */}
              <div className="flex items-center justify-between bg-slate-100 dark:bg-slate-800/60 rounded-xl px-4 py-3">
                <span className="text-sm text-slate-600 dark:text-slate-400">
                  Current Stock
                </span>
                <span className="font-price font-bold text-xl text-slate-900 dark:text-slate-100">
                  {product.quantity}{" "}
                  <span className="text-slate-500 text-sm font-normal">
                    {product.unit}
                  </span>
                </span>
              </div>

              {/* Movement type selector */}
              <div>
                <label className="label">Movement Type</label>
                <div className="grid grid-cols-3 gap-2">
                  {(Object.keys(TYPE_CONFIG) as StockMovementType[]).map(
                    (type) => {
                      const {
                        label,
                        icon: Icon,
                        color,
                        bg,
                      } = TYPE_CONFIG[type];
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
                              : "border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40 text-slate-400 dark:text-slate-500",
                          )}
                        >
                          <Icon size={20} />
                          <span className="text-xs font-semibold">{label}</span>
                        </button>
                      );
                    },
                  )}
                </div>
              </div>

              {/* Shared Input Components */}
              <QuantitySelector
                label={
                  selectedType === "ADJUSTMENT" ? "New Quantity" : "Quantity"
                }
              />

              {(selectedType === "OUT" || selectedType === "RETURN") && (
                <PriceAdjustment product={product} />
              )}

              {/* Stock Preview */}
              <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-800/40 rounded-xl px-4 py-3">
                <span className="text-sm text-slate-600 dark:text-slate-400">
                  New Stock After
                </span>
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

              <div className="space-y-4">
                <div>
                  <label className="label">Note / Reason</label>
                  <input
                    {...register("note")}
                    className="input-field"
                    placeholder="Optional note…"
                  />
                </div>
                <div>
                  <label className="label">Invoice / PO Reference</label>
                  <input
                    {...register("reference")}
                    className="input-field font-mono"
                    placeholder="e.g. INV-2024-001"
                  />
                </div>
              </div>
            </div>

            {/* Fixed Sticky Footer */}
            <div className="p-5 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex-shrink-0">
              <button
                type="submit"
                disabled={isLoading}
                className={cn(
                  "w-full flex items-center justify-center gap-2 py-4 rounded-xl font-bold text-base transition-all active:scale-[0.98] shadow-lg",
                  selectedType === "IN"
                    ? "bg-emerald-500 text-white shadow-emerald-500/20"
                    : selectedType === "OUT"
                      ? "bg-red-500 text-white shadow-red-500/20"
                      : selectedType === "RETURN"
                        ? "bg-amber-500 text-white shadow-amber-500/20"
                        : "bg-blue-500 text-white shadow-blue-500/20",
                )}
              >
                <span>
                  {selectedType === "IN"
                    ? "↑"
                    : selectedType === "OUT"
                      ? "↓"
                      : selectedType === "RETURN"
                        ? "↺"
                        : "⇔"}
                </span>
                {isLoading
                  ? "Saving…"
                  : `Confirm ${TYPE_CONFIG[selectedType].label}`}
              </button>
            </div>
          </form>
        </FormProvider>
      </div>
    </div>
  );
}
