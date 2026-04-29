"use client";

import { useFormContext } from "react-hook-form";
import { MovementFormData } from "./schema";
import { cn } from "@/lib/utils";
import type { Product } from "@/types";

interface PriceAdjustmentProps {
  product: Product;
}

export function PriceAdjustment({ product }: PriceAdjustmentProps) {
  const {
    register,
    watch,
    setValue,
  } = useFormContext<MovementFormData>();

  const quantity = watch("quantity") || 0;
  const unitPrice = watch("unitPrice") || 0;

  return (
    <div className="p-4 bg-orange-500/5 dark:bg-orange-500/10 rounded-2xl border border-orange-500/20 space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-sm font-bold text-orange-600 dark:text-orange-400">
          Sale Price Adjustment
        </label>
        <div className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded bg-orange-500 text-white">
          Live
        </div>
      </div>
      <div className="flex gap-2 items-center">
        <button
          type="button"
          onClick={() => {
            const current = Number(unitPrice) || 0;
            setValue("unitPrice", Math.max(0, current - 1), {
              shouldValidate: true,
            });
          }}
          className="w-10 h-10 rounded-lg bg-white dark:bg-slate-800 border border-orange-500/30 text-orange-500 hover:bg-orange-50 flex items-center justify-center flex-shrink-0 transition-all active:scale-90"
        >
          −
        </button>
        <div className="relative flex-1">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">
            $
          </span>
          <input
            {...register("unitPrice")}
            type="number"
            step="0.01"
            className="w-full bg-white dark:bg-slate-800 border border-orange-500/30 rounded-lg py-2 pl-7 pr-3 text-center font-price font-bold text-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-orange-500/40"
          />
        </div>
        <button
          type="button"
          onClick={() => {
            const current = Number(unitPrice) || 0;
            setValue("unitPrice", current + 1, {
              shouldValidate: true,
            });
          }}
          className="w-10 h-10 rounded-lg bg-white dark:bg-slate-800 border border-orange-500/30 text-orange-500 hover:bg-orange-50 flex items-center justify-center flex-shrink-0 transition-all active:scale-90"
        >
          +
        </button>
      </div>
      <div className="flex justify-between items-center text-xs">
        <span className="text-slate-500">
          Base Price: ${product.sellPrice}
        </span>
        <span
          className={cn(
            "font-bold",
            (unitPrice ?? 0) < product.sellPrice
              ? "text-red-500"
              : (unitPrice ?? 0) > product.sellPrice
                ? "text-emerald-500"
                : "text-slate-500",
          )}
        >
          {(unitPrice ?? 0) < product.sellPrice
            ? "Discounted"
            : (unitPrice ?? 0) > product.sellPrice
              ? "Markup"
              : "Original"}
        </span>
      </div>

      {/* Total calculation preview */}
      <div className="pt-2 border-t border-orange-500/10 flex justify-between items-end">
        <span className="text-[10px] uppercase font-bold text-slate-500">
          Total Value
        </span>
        <span className="text-xl font-price font-black text-slate-900 dark:text-slate-100">
          ${(unitPrice * quantity).toLocaleString()}
        </span>
      </div>
    </div>
  );
}
