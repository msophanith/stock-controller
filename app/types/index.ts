// types/index.ts

export type ProductCategory =
  | "Engine Parts"
  | "Engine Oils"
  | "Filters"
  | "Wipers"
  | "Lighting"
  | "Fluids"
  | "Drive Belts"
  | "Brakes"
  | "Suspension"
  | "Electrical"
  | "Bodywork"
  | "Accessories"
  | "Tools"
  | "Other";

export type StockMovementType = "IN" | "OUT" | "ADJUSTMENT" | "RETURN";

export interface Product {
  id: string;
  barcode: string;
  name: string;
  category: ProductCategory | string;
  description?: string | null;
  buyPrice: number;
  sellPrice: number;
  quantity: number;
  minStock: number;
  shelf?: string | null;
  imageUrl?: string | null;
  unit: string;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface StockMovement {
  id: string;
  productId: string;
  type: StockMovementType;
  quantity: number;
  unitPrice?: number | null;
  note?: string | null;
  reference?: string | null;
  createdAt: Date | string;
  product?: Product; // For JOINs
}

export interface DashboardStats {
  totalProducts: number;
  totalValue: number;
  lowStockCount: number;
  todayMovements: number;
  outOfStock: number;
}
