// app/api/movements/bulk/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { addMultipleMovements } from '@/lib/supabaseDb';

export async function POST(req: NextRequest) {
  try {
    const movements = await req.json();
    if (!Array.isArray(movements)) {
      return NextResponse.json(
        { error: 'Expected an array of movements' },
        { status: 400 }
      );
    }
    const results = await addMultipleMovements(movements);
    return NextResponse.json(results, { status: 201 });
  } catch (err: any) {
    console.error('Error adding multiple movements:', err);
    return NextResponse.json(
      { error: err?.message || 'Failed to add movements' },
      { status: 500 }
    );
  }
}
