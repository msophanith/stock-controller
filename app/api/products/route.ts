// app/api/products/route.ts
import { NextRequest, NextResponse } from 'next/server';
import {
  getAllProducts,
  createProduct,
} from '@/lib/firebaseDb';

export async function GET(req: NextRequest) {
  try {
    const products = await getAllProducts();
    return NextResponse.json(products);
  } catch (err) {
    console.error('Error fetching products:', err);
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const product = await createProduct({
      barcode: body.barcode,
      name: body.name,
      category: body.category,
      description: body.description,
      buyPrice: body.buyPrice,
      sellPrice: body.sellPrice,
      quantity: body.quantity || 0,
      minStock: body.minStock || 5,
      shelf: body.shelf,
      imageUrl: body.imageUrl,
      unit: body.unit ?? 'pcs',
    });
    return NextResponse.json(product, { status: 201 });
  } catch (err: any) {
    console.error('Error creating product:', err);
    return NextResponse.json(
      { error: 'Failed to create product' },
      { status: 500 }
    );
  }
}
