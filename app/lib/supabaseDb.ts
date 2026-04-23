// lib/supabaseDb.ts
// Supabase operations (HTTP/HTTPS) to bypass port-blocking firewalls
import { supabase as supabaseAdmin } from "./supabaseAdmin";
import type { Product, StockMovement } from "@/types";
import { v4 as uuidv4 } from "uuid";

// ─── Product helpers ──────────────────────────────────────────────────────────

export async function getAllProducts(): Promise<Product[]> {
  try {
    const { data, error } = await supabaseAdmin
      .from("Product")
      .select("*")
      .order("updatedAt", { ascending: false });

    if (error) throw error;
    return data as unknown as Product[];
  } catch (error) {
    console.error("Error fetching products:", error);
    return [];
  }
}

export async function getProductById(id: string): Promise<Product | null> {
  try {
    const { data, error } = await supabaseAdmin
      .from("Product")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error) throw error;
    return data as unknown as Product;
  } catch (error) {
    console.error("Error fetching product:", error);
    return null;
  }
}

export async function getProductByBarcode(
  barcode: string,
): Promise<Product | null> {
  try {
    const { data, error } = await supabaseAdmin
      .from("Product")
      .select("*")
      .eq("barcode", barcode)
      .maybeSingle();

    if (error) throw error;
    return data as unknown as Product;
  } catch (error) {
    console.error("Error fetching product by barcode:", error);
    return null;
  }
}

export async function createProduct(
  product: Partial<Product>,
): Promise<Product> {
  try {
    const { data, error } = await supabaseAdmin
      .from("Product")
      .insert({
        id: product.id || uuidv4(),
        barcode: product.barcode,
        name: product.name,
        category: product.category,
        description: product.description,
        buyPrice: product.buyPrice,
        sellPrice: product.sellPrice,
        quantity: product.quantity ?? 0,
        minStock: product.minStock ?? 5,
        shelf: product.shelf,
        imageUrl: product.imageUrl,
        unit: product.unit ?? "pcs",
      })
      .select()
      .single();

    if (error) throw error;
    return data as unknown as Product;
  } catch (error) {
    console.error("Error creating product:", error);
    throw error;
  }
}

export async function updateProduct(
  id: string,
  updates: Partial<Product>,
): Promise<Product | null> {
  try {
    const { data, error } = await supabaseAdmin
      .from("Product")
      .update({
        barcode: updates.barcode,
        name: updates.name,
        category: updates.category,
        description: updates.description,
        buyPrice: updates.buyPrice,
        sellPrice: updates.sellPrice,
        quantity: updates.quantity,
        minStock: updates.minStock,
        shelf: updates.shelf,
        imageUrl: updates.imageUrl,
        unit: updates.unit,
        updatedAt: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return data as unknown as Product;
  } catch (error) {
    console.error("Error updating product:", error);
    throw error;
  }
}

export async function deleteProduct(id: string): Promise<void> {
  try {
    const { error } = await supabaseAdmin.from("Product").delete().eq("id", id);

    if (error) throw error;
  } catch (error) {
    console.error("Error deleting product:", error);
    throw error;
  }
}

export async function getLowStockProducts(
  minStock?: number,
): Promise<Product[]> {
  try {
    const { data, error } = await supabaseAdmin
      .from("Product")
      .select("*")
      .lte("quantity", minStock ?? 5);

    if (error) throw error;
    return data as unknown as Product[];
  } catch (error) {
    console.error("Error fetching low stock products:", error);
    return [];
  }
}

// ─── Movement helpers ─────────────────────────────────────────────────────────

export async function addMovement(
  movement: Partial<StockMovement>,
): Promise<StockMovement> {
  try {
    // 1. Create movement
    const { data: dbMovement, error: movementError } = await supabaseAdmin
      .from("StockMovement")
      .insert({
        id: movement.id || uuidv4(),
        productId: movement.productId,
        type: movement.type,
        quantity: movement.quantity,
        note: movement.note,
        reference: movement.reference,
      })
      .select()
      .single();

    if (movementError) throw movementError;

    // 2. Fetch product and update quantity
    if (movement.productId) {
      const product = await getProductById(movement.productId);

      if (product) {
        let delta = movement.quantity || 0;
        if (movement.type === "OUT") {
          delta = -delta;
        } else if (movement.type === "RETURN") {
          // Returns increase stock
          delta = Math.abs(delta);
        }

        const newQty = Math.max(0, product.quantity + delta);
        await updateProduct(movement.productId, { quantity: newQty });
      }
    }

    return dbMovement as unknown as StockMovement;
  } catch (error) {
    console.error("Error adding movement:", error);
    throw error;
  }
}

export async function getMovementsForProduct(
  productId: string,
  limitCount = 50,
): Promise<StockMovement[]> {
  try {
    const { data, error } = await supabaseAdmin
      .from("StockMovement")
      .select("*")
      .eq("productId", productId)
      .order("createdAt", { ascending: false })
      .limit(limitCount);

    if (error) throw error;
    return data as unknown as StockMovement[];
  } catch (error) {
    console.error("Error fetching movements:", error);
    return [];
  }
}

export async function getRecentMovements(
  limitCount = 50,
): Promise<StockMovement[]> {
  try {
    const { data, error } = await supabaseAdmin
      .from("StockMovement")
      .select("*, product:Product(*)")
      .order("createdAt", { ascending: false })
      .limit(limitCount);

    if (error) throw error;
    return data as unknown as StockMovement[];
  } catch (error) {
    console.error("Error fetching recent movements:", error);
    return [];
  }
}

export async function getTodaySales(): Promise<StockMovement[]> {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { data, error } = await supabaseAdmin
      .from("StockMovement")
      .select("*, product:Product(*)")
      .in("type", ["OUT", "RETURN"])
      .gte("createdAt", today.toISOString())
      .order("createdAt", { ascending: false });

    if (error) throw error;
    return data as unknown as StockMovement[];
  } catch (error) {
    console.error("Error fetching today's sales:", error);
    return [];
  }
}

// ─── Bulk operations ──────────────────────────────────────────────────────────

export async function bulkImportProducts(products: Product[]): Promise<void> {
  try {
    const { error } = await supabaseAdmin.from("Product").upsert(
      products.map((p) => ({
        id: p.id,
        barcode: p.barcode,
        name: p.name,
        category: p.category,
        description: p.description,
        buyPrice: p.buyPrice,
        sellPrice: p.sellPrice,
        quantity: p.quantity,
        minStock: p.minStock,
        shelf: p.shelf,
        imageUrl: p.imageUrl,
        unit: p.unit,
        updatedAt: p.updatedAt || new Date().toISOString(),
      })),
    );

    if (error) throw error;
  } catch (error) {
    console.error("Error bulk importing products:", error);
    throw error;
  }
}
// ─── Dashboard Summary ────────────────────────────────────────────────────────
export async function getDashboardSummary() {
  try {
    // 1. Fetch only necessary fields for ALL products to calculate stats and alerts
    const { data: allProducts, error: err } = await supabaseAdmin
      .from("Product")
      .select(
        "id, name, category, barcode, shelf, unit, sellPrice, buyPrice, quantity, minStock, updatedAt",
      )
      .order("updatedAt", { ascending: false });

    if (err) throw err;

    const products = allProducts as unknown as Product[];

    // 2. Calculate stats
    const totalProducts = products.length;
    const totalValue = products.reduce(
      (acc, p) => acc + p.sellPrice * p.quantity,
      0,
    );
    const lowStockProducts = products.filter(
      (p) => p.quantity > 0 && p.quantity <= p.minStock,
    );
    const outOfStockProducts = products.filter((p) => p.quantity === 0);

    const stats = {
      totalProducts,
      totalValue,
      lowStockCount: lowStockProducts.length,
      outOfStockCount: outOfStockProducts.length,
    };

    // 3. Prepare preview lists
    const recentProducts = products.slice(0, 5);
    const alertProducts = [...outOfStockProducts, ...lowStockProducts].slice(
      0,
      10,
    );

    return {
      stats,
      recentProducts,
      alertProducts,
      allProducts: [], // Defer full list to client-side background fetch
    };
  } catch (error) {
    console.error("Error fetching dashboard summary:", error);
    throw error;
  }
}
