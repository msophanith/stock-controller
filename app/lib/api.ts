// lib/api.ts
import type { Product, StockMovement } from "@/types";

// Generic fetch wrapper
async function apiFetch<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.error || `Request failed with status ${response.status}`,
    );
  }

  return response.json();
}

// ─── Products ─────────────────────────────────────────────────────────────────

export async function apiGetAllProducts(): Promise<Product[]> {
  return apiFetch<Product[]>("/api/products");
}

export async function apiGetProductById(
  id: string,
): Promise<Product & { movements: StockMovement[] }> {
  return apiFetch<Product & { movements: StockMovement[] }>(
    `/api/products/${id}`,
  );
}

export async function apiGetProductByBarcode(
  barcode: string,
): Promise<Product | null> {
  // We can add a specialized search or just fetch all and filter client side
  // but better to have an API. Let's assume we use /api/products/[id] search?
  // For now, we'll fetch all and filter or add a search API.
  const products = await apiGetAllProducts();
  return products.find((p) => p.barcode === barcode) || null;
}

export async function apiSaveProduct(
  product: Partial<Product>,
): Promise<Product> {
  if (product.id) {
    // Update
    return apiFetch<Product>(`/api/products/${product.id}`, {
      method: "PUT",
      body: JSON.stringify(product),
    });
  } else {
    // Create
    return apiFetch<Product>("/api/products", {
      method: "POST",
      body: JSON.stringify(product),
    });
  }
}

export async function apiDeleteProduct(id: string): Promise<void> {
  return apiFetch<void>(`/api/products/${id}`, {
    method: "DELETE",
  });
}

// ─── Movements ────────────────────────────────────────────────────────────────

export async function apiGetRecentMovements(
  limit = 100,
): Promise<StockMovement[]> {
  return apiFetch<StockMovement[]>(`/api/movements?limit=${limit}`);
}

export async function apiGetTodaySales(): Promise<StockMovement[]> {
  return apiFetch<StockMovement[]>("/api/movements/today");
}

export async function apiAddMovement(
  movement: Partial<StockMovement>,
): Promise<StockMovement> {
  // We use the sync endpoint or a dedicated movements endpoint?
  // Let's create a dedicated one in movements/route.ts if not exists.
  // Actually, I already have /api/movements [GET]. Let's add [POST].
  return apiFetch<StockMovement>("/api/movements", {
    method: "POST",
    body: JSON.stringify(movement),
  });
}
