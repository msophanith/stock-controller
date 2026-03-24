// app/api/sync/route.ts
// Batch sync endpoint — processes multiple offline changes in one request

import { NextRequest, NextResponse } from 'next/server';
import {
  getProductById,
  updateProduct,
  deleteProduct,
  createProduct,
  addMovement,
} from '@/lib/firebaseDb';

interface SyncItem {
  table: 'products' | 'movements';
  action: 'CREATE' | 'UPDATE' | 'DELETE';
  recordId: string;
  payload: Record<string, any>;
  timestamp: number;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    if (!body || typeof body !== 'object') {
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      );
    }

    const { items } = body as { items: SyncItem[] };
    
    if (!Array.isArray(items)) {
      return NextResponse.json(
        { error: 'items must be an array' },
        { status: 400 }
      );
    }

    const results: { recordId: string; success: boolean; error?: string }[] =
      [];

    for (const item of items) {
      try {
        await processSyncItem(item);
        results.push({ recordId: item.recordId, success: true });
      } catch (err: any) {
        results.push({
          recordId: item.recordId,
          success: false,
          error: err?.message || String(err) || 'Unknown error',
        });
      }
    }

    return NextResponse.json({ results });
  } catch (err: any) {
    console.error('Sync endpoint error:', err);
    return NextResponse.json(
      { error: err?.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

async function processSyncItem(item: SyncItem) {
  const { table, action, payload } = item;

  if (table === 'products') {
    if (action === 'CREATE') {
      await createProduct({
        barcode: payload.barcode,
        name: payload.name,
        category: payload.category,
        description: payload.description,
        buyPrice: payload.buyPrice,
        sellPrice: payload.sellPrice,
        quantity: payload.quantity,
        minStock: payload.minStock,
        shelf: payload.shelf,
        unit: payload.unit ?? 'pcs',
        imageUrl: payload.imageUrl,
      });
    } else if (action === 'UPDATE') {
      // Check for conflicts: server record updated more recently?
      const existing = await getProductById(payload.id);

      if (
        existing &&
        new Date(existing.updatedAt) > new Date(payload.updatedAt)
      ) {
        // Server wins — skip this update
        return;
      }

      await updateProduct(payload.id, {
        name: payload.name,
        category: payload.category,
        description: payload.description,
        buyPrice: payload.buyPrice,
        sellPrice: payload.sellPrice,
        quantity: payload.quantity,
        minStock: payload.minStock,
        shelf: payload.shelf,
        unit: payload.unit ?? 'pcs',
        imageUrl: payload.imageUrl,
      });
    } else if (action === 'DELETE') {
      await deleteProduct(payload.id);
    }
  } else if (table === 'movements') {
    if (action === 'CREATE') {
      await addMovement({
        productId: payload.productId,
        type: payload.type,
        quantity: payload.quantity,
        note: payload.note,
        reference: payload.reference,
      });
    }
  }
}
