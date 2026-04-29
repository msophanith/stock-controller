"use client";

import { useFormContext } from "react-hook-form";
import { MovementFormData } from "./schema";

interface QuantitySelectorProps {
  readonly label: string;
}

export function QuantitySelector({ label }: QuantitySelectorProps) {
  const {
    register,
    watch,
    setValue,
    formState: { errors },
  } = useFormContext<MovementFormData>();

  const quantity = watch("quantity") || 0;

  return (
    <div>
      <label className="label">{label}</label>
      <div className="flex gap-2 items-center">
        <button
          type="button"
          onClick={() => {
            if (quantity > 1) {
              setValue("quantity", quantity - 1, {
                shouldValidate: true,
              });
            }
          }}
          className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xl font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center flex-shrink-0 transition-all active:scale-95"
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
            setValue("quantity", quantity + 1, {
              shouldValidate: true,
            });
          }}
          className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xl font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center flex-shrink-0 transition-all active:scale-95"
        >
          +
        </button>
      </div>
      {errors.quantity && (
        <p className="text-red-400 text-xs mt-1">{errors.quantity.message}</p>
      )}
    </div>
  );
}
