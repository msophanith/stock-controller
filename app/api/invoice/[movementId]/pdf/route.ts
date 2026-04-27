import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseAdmin";
import { generateInvoicePDF } from "@/lib/invoiceGenerator";
import type { Product, StockMovement } from "@/types";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
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

    // If the movement has a reference, fetch all items for this sale
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

    // Fallback to single item if no reference or fetch failed
    if (items.length === 0) {
      items = [
        {
          product: movement.product as unknown as Product,
          movement: movement as unknown as StockMovement,
        },
      ];
    }

    const pdfBuffer = await generateInvoicePDF(items);

    return new NextResponse(pdfBuffer as unknown as BodyInit, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="invoice_${movementId}.pdf"`,
      },
    });
  } catch (error) {
    console.error("PDF generation error:", error);
    return new NextResponse("Failed to generate PDF", { status: 500 });
  }
}
