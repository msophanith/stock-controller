"use client";

import { Minus, Plus, Trash2, Package, TrendingDown } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import type { CartItem as CartItemType } from "@/store/cart-store";

interface CartItemProps {
  item: CartItemType;
  onUpdateQuantity: (id: string, qty: number) => void;
  onUpdatePrice: (id: string, price: number) => void;
  onRemove: (id: string) => void;
}

export function CartItem({
  item,
  onUpdateQuantity,
  onUpdatePrice,
  onRemove,
}: CartItemProps) {
  return (
    <div className="group relative bg-white dark:bg-[#0f172a] rounded-[2rem] p-5 border border-slate-100 dark:border-slate-800/50 shadow-sm hover:shadow-2xl hover:shadow-orange-500/10 transition-all duration-500 flex items-center gap-5">
      {/* Product Image */}
      <div className="relative w-20 h-20 rounded-3xl bg-slate-50 dark:bg-slate-800/50 flex items-center justify-center text-slate-400 flex-shrink-0 overflow-hidden border border-slate-100/50 dark:border-slate-700/30">
        {item.product.imageUrl ? (
          <img
            src={item.product.imageUrl}
            alt={item.product.name}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
          />
        ) : (
          <Package
            size={28}
            className="group-hover:rotate-12 transition-transform duration-500"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>

      {/* Info Area */}
      <div className="flex-1 min-w-0">
        <h3 className="font-bold text-base text-slate-900 dark:text-slate-100 truncate tracking-tight mb-1">
          {item.product.name}
        </h3>

        <div className="flex items-center gap-3">
          <div className="relative group/price-input">
            <div className="flex items-center gap-1 px-3 py-1.5 rounded-2xl bg-slate-50/50 dark:bg-slate-800/50 border border-transparent group-hover/price-input:border-slate-200 dark:group-hover/price-input:border-slate-700 focus-within:border-orange-500/50 focus-within:bg-white dark:focus-within:bg-slate-900 focus-within:shadow-lg focus-within:shadow-orange-500/10 transition-all duration-300">
              <span className="text-xs font-black text-slate-400 dark:text-slate-500 font-mono translate-y-[1px]">$</span>
              <input
                type="number"
                step="0.01"
                value={item.unitPrice || ""}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  onUpdatePrice(item.product.id, isNaN(val) ? 0 : val);
                }}
                className="w-20 bg-transparent text-xl font-black text-slate-900 dark:text-white font-mono tracking-tighter outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                placeholder="0.00"
              />
            </div>
          </div>
          {item.unitPrice !== item.product.sellPrice && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-500 text-[10px] font-black uppercase tracking-widest ring-1 ring-blue-500/20 animate-in zoom-in duration-300">
              <TrendingDown size={10} />
              <span>Adjusted</span>
            </div>
          )}
        </div>
      </div>

      {/* Minimalist Controls */}
      <div className="flex flex-col gap-4 items-end flex-shrink-0">
        <div className="flex items-center gap-4">
          {/* Price Adjuster - Minimalist */}
          <div className="flex flex-col items-center gap-1">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">
              Price
            </span>
            <div className="flex items-center bg-slate-100/50 dark:bg-slate-800/50 rounded-full p-1 border border-slate-200/50 dark:border-slate-700/50">
              <button
                onClick={() =>
                  onUpdatePrice(item.product.id, item.unitPrice - 0.5)
                }
                className="w-7 h-7 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-blue-500 transition-colors"
              >
                <Minus size={14} />
              </button>
              <div className="w-[1px] h-3 bg-slate-200 dark:bg-slate-700 mx-1" />
              <button
                onClick={() =>
                  onUpdatePrice(item.product.id, item.unitPrice + 0.5)
                }
                className="w-7 h-7 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-blue-500 transition-colors"
              >
                <Plus size={14} />
              </button>
            </div>
          </div>

          {/* Quantity - Premium Pill */}
          <div className="flex flex-col items-center gap-1">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">
              Qty
            </span>
            <div className="flex items-center bg-slate-900 dark:bg-white rounded-full p-1 shadow-lg shadow-slate-900/10 dark:shadow-white/5">
              <button
                onClick={() =>
                  onUpdateQuantity(item.product.id, item.quantity - 1)
                }
                disabled={item.product.quantity <= 1}
                className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-white dark:text-slate-500 dark:hover:text-black transition-colors disabled:opacity-20"
              >
                <Minus size={16} strokeWidth={3} />
              </button>
              <span className="w-8 text-center font-black text-sm text-white dark:text-black">
                {item.quantity}
              </span>
              <button
                onClick={() =>
                  onUpdateQuantity(item.product.id, item.quantity + 1)
                }
                disabled={
                  item.product.quantity <= 1 ||
                  item.quantity >= item.product.quantity
                }
                className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-white dark:text-slate-500 dark:hover:text-black transition-colors disabled:opacity-20"
              >
                <Plus size={16} strokeWidth={3} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Remove Button */}
      <button
        onClick={() => onRemove(item.product.id)}
        className="w-10 h-10 flex items-center justify-center text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-full transition-all active:scale-90"
      >
        <Trash2 size={20} />
      </button>
    </div>
  );
}
