// app/api/products/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import {
  getProductById,
  updateProduct,
  deleteProduct,
  getMovementsForProduct,
} from "@/lib/supabaseDb";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const product = await getProductById(params.id);
    if (!product) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const movements = await getMovementsForProduct(params.id, 50);
    return NextResponse.json({ ...product, movements });
  } catch (err) {
    console.error("Error fetching product:", err);
    return NextResponse.json(
      { error: "Failed to fetch product" },
      { status: 500 },
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const body = await req.json();
    const updated = await updateProduct(params.id, {
      name: body.name,
      category: body.category,
      description: body.description,
      buyPrice: body.buyPrice,
      sellPrice: body.sellPrice,
      quantity: body.quantity,
      minStock: body.minStock,
      shelf: body.shelf,
      unit: body.unit,
    });
    return NextResponse.json(updated);
  } catch (err) {
    console.error("Error updating product:", err);
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    await deleteProduct(params.id);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Error deleting product:", err);
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
}
