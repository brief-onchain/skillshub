import { NextResponse } from 'next/server';
import { distributeDividend, verifyCronRequest } from '@/lib/server/nfa-admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function handle(request: Request) {
  const auth = verifyCronRequest(request);
  if (!auth.ok) {
    return NextResponse.json({ success: false, error: auth.error }, { status: 401 });
  }

  try {
    const result = await distributeDividend();
    return NextResponse.json({
      success: true,
      action: 'distribute',
      ...result
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Dividend distribute failed'
      },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  return await handle(request);
}

export async function POST(request: Request) {
  return await handle(request);
}
