import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseAdmin";
import { generateInvoiceImage } from "@/lib/invoiceGenerator";
import type { Product, StockMovement } from "@/types";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: { movementId: string } },
) {
  try {
    const { movementId } = params;

    const { data: movement, error: movErr } = await supabase
      .from("StockMovement")
      .select("*, product:Product(*)")
      .eq("id", movementId)
      .single();

    if (movErr || !movement) {
      return new NextResponse("Movement not found", { status: 404 });
    }

    let items: { product: Product; movement: StockMovement }[] = [];

    if (movement.reference) {
      const { data: relatedMovements, error: relErr } = await supabase
        .from("StockMovement")
        .select("*, product:Product(*)")
        .eq("reference", movement.reference)
        .order("createdAt", { ascending: true });

      if (!relErr && relatedMovements && relatedMovements.length > 0) {
        items = relatedMovements.map((m: any) => ({
          product: m.product as unknown as Product,
          movement: m as unknown as StockMovement,
        }));
      }
    }

    if (items.length === 0) {
      items = [
        {
          product: movement.product as unknown as Product,
          movement: movement as unknown as StockMovement,
        },
      ];
    }

    const imageBuffer = await generateInvoiceImage(items);

    return new NextResponse(imageBuffer as unknown as BodyInit, {
      headers: {
        "Content-Type": "image/png",
        "Content-Disposition": `inline; filename="invoice_${movementId}.png"`,
      },
    });
  } catch (error) {
    console.error("Image generation error:", error);
    return new NextResponse("Failed to generate Image", { status: 500 });
  }
}
