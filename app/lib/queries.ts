import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  apiGetAllProducts,
  apiGetProductById,
  apiGetProductByBarcode,
  apiSaveProduct,
  apiDeleteProduct,
  apiAddMovement,
  apiGetRecentMovements,
  apiGetTodaySales,
} from "./api";
import { Product, StockMovement } from "@/types";

export const QUERY_KEYS = {
  products: ["products"] as const,
  product: (id: string) => ["products", id] as const,
  barcode: (barcode: string) => ["products", "barcode", barcode] as const,
  movements: ["movements"] as const,
  movement: (productId: string) => ["movements", productId] as const,
};

// --- GET ---

export function useProducts(options?: any) {
  return useQuery<Product[]>({
    queryKey: QUERY_KEYS.products,
    queryFn: apiGetAllProducts,
    ...options,
  });
}

export function useProduct(id: string) {
  return useQuery<Product & { movements: StockMovement[] }>({
    queryKey: QUERY_KEYS.product(id),
    queryFn: () => apiGetProductById(id),
    enabled: !!id,
  });
}

export function useProductByBarcode(barcode: string) {
  return useQuery<Product | null>({
    queryKey: QUERY_KEYS.barcode(barcode),
    queryFn: () => apiGetProductByBarcode(barcode),
    enabled: !!barcode,
  });
}

export function useRecentMovements() {
  return useQuery<StockMovement[]>({
    queryKey: QUERY_KEYS.movements,
    queryFn: () => apiGetRecentMovements(50),
  });
}

export function useTodaySales(options?: any) {
  return useQuery<StockMovement[]>({
    queryKey: ["movements", "today"],
    queryFn: () => apiGetTodaySales(),
    ...options,
  });
}

// --- MUTATIONS ---

export function useSaveProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: apiSaveProduct,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.products });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.product(data.id) });
      if (data.barcode) {
        queryClient.invalidateQueries({
          queryKey: QUERY_KEYS.barcode(data.barcode),
        });
      }
    },
  });
}

export function useDeleteProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: apiDeleteProduct,
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.products });
      queryClient.removeQueries({ queryKey: QUERY_KEYS.product(id) });
    },
  });
}

export function useAddMovement() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: apiAddMovement,
    onSuccess: (data, variables) => {
      // Invalidate movements
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.movements });
      queryClient.invalidateQueries({ queryKey: ["movements", "today"] });
      if (variables.productId) {
        queryClient.invalidateQueries({
          queryKey: QUERY_KEYS.movement(variables.productId),
        });
        // Also update the product details (quantity changed)
        queryClient.invalidateQueries({
          queryKey: QUERY_KEYS.product(variables.productId),
        });
      }
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.products });
    },
  });
}
