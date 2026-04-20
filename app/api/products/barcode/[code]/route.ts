// app/api/products/barcode/[code]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getProductByBarcode } from "@/lib/supabaseDb";

export async function GET(
  req: NextRequest,
  { params }: { params: { code: string } },
) {
  try {
    const { code } = params;
    const product = await getProductByBarcode(code);

    if (!product) {
      return NextResponse.json(null, { status: 404 });
    }

    return NextResponse.json(product);
  } catch (err) {
    console.error("Error fetching product by barcode:", err);
    return NextResponse.json(
      { error: "Failed to fetch product by barcode" },
      { status: 500 },
    );
  }
}
