"use client";
// components/ui/confirm-dialog.tsx

import { useEffect, useRef } from "react";
import { AlertTriangle, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ConfirmDialogProps {
  readonly open: boolean;
  readonly title: string;
  readonly message: string;
  readonly confirmLabel?: string;
  readonly cancelLabel?: string;
  readonly variant?: "danger" | "warning" | "default";
  readonly isLoading?: boolean;
  readonly onConfirm: () => void;
  readonly onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "default",
  isLoading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (open) {
      cancelRef.current?.focus();

      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === "Escape" && !isLoading) onCancel();
      };
      document.addEventListener("keydown", handleEscape);
      return () => document.removeEventListener("keydown", handleEscape);
    }
  }, [open, isLoading, onCancel]);

  if (!open) return null;

  const variantStyles = {
    danger: {
      icon: "bg-red-500/10 text-red-400",
      button:
        "bg-red-500 hover:bg-red-400 text-white active:bg-red-600",
    },
    warning: {
      icon: "bg-amber-500/10 text-amber-400",
      button:
        "bg-amber-500 hover:bg-amber-400 text-white active:bg-amber-600",
    },
    default: {
      icon: "bg-orange-500/10 text-orange-400",
      button:
        "bg-orange-500 hover:bg-orange-400 text-white active:bg-orange-600",
    },
  };

  const styles = variantStyles[variant];

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fadeIn"
        onClick={isLoading ? undefined : onCancel}
      />

      {/* Dialog */}
      <div className="relative w-full max-w-sm dark:bg-slate-900 bg-white border dark:border-slate-700 border-slate-200 rounded-2xl shadow-2xl animate-scaleIn overflow-hidden">
        {/* Close button */}
        <button
          onClick={onCancel}
          disabled={isLoading}
          className="absolute top-4 right-4 w-7 h-7 rounded-lg flex items-center justify-center dark:text-slate-400 text-slate-500 dark:hover:bg-slate-800 hover:bg-slate-100 transition-colors"
        >
          <X size={16} />
        </button>

        <div className="p-6 text-center">
          {/* Icon */}
          <div
            className={cn(
              "w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4",
              styles.icon,
            )}
          >
            <AlertTriangle size={28} />
          </div>

          {/* Content */}
          <h3 className="text-lg font-bold dark:text-slate-100 text-slate-900 mb-2">
            {title}
          </h3>
          <p className="text-sm dark:text-slate-400 text-slate-600 leading-relaxed">
            {message}
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-3 px-6 pb-6">
          <button
            ref={cancelRef}
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="flex-1 btn-secondary py-3 text-sm"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm transition-all active:scale-95 disabled:opacity-50",
              styles.button,
            )}
          >
            {isLoading ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Processing…
              </>
            ) : (
              confirmLabel
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
