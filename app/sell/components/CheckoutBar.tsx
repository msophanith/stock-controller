"use client";

import { TrendingDown } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface CheckoutBarProps {
  total: number;
  isSubmitting: boolean;
  onCheckout: () => void;
}

export function CheckoutBar({
  total,
  isSubmitting,
  onCheckout,
}: CheckoutBarProps) {
  return (
    <div className="fixed bottom-20 left-0 right-0 p-4 z-40 bg-white/60 dark:bg-slate-950/60 backdrop-blur-2xl border-t border-slate-100 dark:border-slate-800/50 safe-area-bottom shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)]">
      <div className="max-w-md mx-auto flex items-center justify-between gap-6">
        <div className="flex flex-col">
          <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-1">
            Payable Amount
          </p>
          <div className="flex items-baseline gap-1">
            <span className="text-sm font-black text-orange-400">$</span>
            <p className="text-3xl font-black text-slate-900 dark:text-slate-50 font-mono tracking-tighter">
              {total.toFixed(2)}
            </p>
          </div>
        </div>
        
        <button
          onClick={onCheckout}
          disabled={isSubmitting}
          className="flex-1 relative group overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-orange-600 to-orange-400 group-hover:scale-105 transition-transform duration-500" />
          <div className="relative flex items-center justify-center gap-3 py-4 px-6 text-white font-black text-base uppercase tracking-wider">
            {isSubmitting ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <span>Complete Sale</span>
                <TrendingDown size={20} className="group-hover:translate-y-1 transition-transform" />
              </>
            )}
          </div>
          <div className="absolute inset-0 shadow-inner group-active:bg-black/10 transition-colors" />
        </button>
      </div>
    </div>
  );
}
