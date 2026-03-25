import { NextResponse } from 'next/server';
import { getTodaySales } from '@/lib/supabaseDb';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const sales = await getTodaySales();
    return NextResponse.json(sales);
  } catch (err) {
    console.error('Error fetching today sales:', err);
    return NextResponse.json(
      { error: 'Failed to fetch today sales' },
      { status: 500 }
    );
  }
}
