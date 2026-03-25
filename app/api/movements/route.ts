// app/api/movements/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getRecentMovements, addMovement } from '@/lib/supabaseDb';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = Number.parseInt(searchParams.get('limit') || '50');
    const movements = await getRecentMovements(limit);
    return NextResponse.json(movements);
  } catch (err) {
    console.error('Error fetching movements:', err);
    return NextResponse.json(
      { error: 'Failed to fetch movements' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const movement = await addMovement(body);
    return NextResponse.json(movement, { status: 201 });
  } catch (err: any) {
    console.error('Error adding movement:', err);
    return NextResponse.json(
      { error: err?.message || 'Failed to add movement' },
      { status: 500 }
    );
  }
}
