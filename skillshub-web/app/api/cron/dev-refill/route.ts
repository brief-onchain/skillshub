import { NextResponse } from 'next/server';
import { refillDividendContract, verifyCronRequest } from '@/lib/server/nfa-admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function parsePayload(request: Request) {
  if (request.method === 'GET') {
    const url = new URL(request.url);
    return {
      amountWei: url.searchParams.get('amountWei') || '',
      amount: url.searchParams.get('amount') || ''
    };
  }

  try {
    const body = await request.json();
    return {
      amountWei: String(body?.amountWei || ''),
      amount: String(body?.amount || '')
    };
  } catch {
    return {
      amountWei: '',
      amount: ''
    };
  }
}

async function handle(request: Request) {
  const auth = verifyCronRequest(request);
  if (!auth.ok) {
    return NextResponse.json({ success: false, error: auth.error }, { status: 401 });
  }

  try {
    const payload = await parsePayload(request);
    const result = await refillDividendContract(payload);
    return NextResponse.json({
      success: true,
      action: 'dev-refill',
      ...result
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Dividend refill failed'
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
