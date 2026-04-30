"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const productSchema = z.object({
  barcode: z.string().min(1, "Barcode is required"),
  name: z.string().min(1, "Name is required"),
  category: z.string().min(1, "Category is required"),
  description: z.string().optional().nullable(),
  buyPrice: z.number().min(0),
  sellPrice: z.number().min(0),
  quantity: z.number().int().min(0).optional().default(0),
  minStock: z.number().int().min(0).optional().default(5),
  shelf: z.string().optional().nullable(),
  unit: z.string().optional().default("pcs"),
});

export type BulkImportResult = {
  success: boolean;
  imported: number;
  errors: { barcode: string; message: string }[];
};

export async function bulkImportProducts(
  data: any[],
): Promise<BulkImportResult> {
  const result: BulkImportResult = {
    success: true,
    imported: 0,
    errors: [],
  };

  const validatedProducts = [];

  for (const item of data) {
    try {
      // Basic type conversion if needed (e.g. from string to number)
      const formatted = {
        ...item,
        barcode: String(item.barcode || ""),
        buyPrice:
          typeof item.buyPrice === "string"
            ? Number.parseFloat(item.buyPrice)
            : Number(item.buyPrice || 0),
        sellPrice:
          typeof item.sellPrice === "string"
            ? Number.parseFloat(item.sellPrice)
            : Number(item.sellPrice || 0),
        quantity:
          typeof item.quantity === "string"
            ? Number.parseInt(item.quantity)
            : Number(item.quantity || 0),
        minStock:
          typeof item.minStock === "string"
            ? Number.parseInt(item.minStock)
            : Number(item.minStock || 5),
      };

      const validated = productSchema.parse(formatted);
      validatedProducts.push(validated);
    } catch (error) {
      if (error instanceof z.ZodError) {
        result.errors.push({
          barcode: String(item.barcode || "Unknown"),
          message: error.errors
            .map((e) => `${e.path.join(".")}: ${e.message}`)
            .join(", "),
        });
      } else {
        result.errors.push({
          barcode: String(item.barcode || "Unknown"),
          message: "Invalid data format",
        });
      }
    }
  }

  // Use sequential updates to handle duplicates gracefully
  for (const product of validatedProducts) {
    try {
      await prisma.product.upsert({
        where: { barcode: product.barcode },
        update: {
          name: product.name,
          category: product.category,
          description: product.description,
          buyPrice: product.buyPrice,
          sellPrice: product.sellPrice,
          quantity: product.quantity,
          minStock: product.minStock,
          shelf: product.shelf,
          unit: product.unit,
        },
        create: product,
      });
      result.imported++;
    } catch (error: any) {
      result.errors.push({
        barcode: product.barcode,
        message: error.message || "Failed to save product",
      });
    }
  }

  if (result.imported > 0) {
    revalidatePath("/products");
    revalidatePath("/dashboard");
    revalidatePath("/sell");
  }

  result.success = result.errors.length === 0;
  return result;
}
