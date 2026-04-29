import { z } from "zod";
import { TrendingUp, TrendingDown, SlidersHorizontal, RotateCcw } from "lucide-react";
import type { StockMovementType } from "@/types";

export const movementSchema = z.object({
  type: z.enum(["IN", "OUT", "ADJUSTMENT", "RETURN"]),
  quantity: z.coerce.number().int().min(1, "Must be at least 1"),
  unitPrice: z.coerce.number().min(0, "Price cannot be negative").optional(),
  note: z.string().optional(),
  reference: z.string().optional(),
});

export type MovementFormData = z.infer<typeof movementSchema>;

export const TYPE_CONFIG: Record<
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
  RETURN: {
    label: "Return",
    icon: RotateCcw,
    color: "text-amber-400",
    bg: "bg-amber-500/20 border-amber-500/40",
  },
};
